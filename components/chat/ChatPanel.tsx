"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleNotch,
  faMicrophone,
  faPaperPlane,
  faPaperclip,
  faPlus,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";

import { Button } from "@/components/ui/Button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { createChatPanelService } from "@/src/presentation/composition/client";
import styles from "./ChatPanel.module.css";

type Message = {
  id: string;
  role: "user" | "assistant";
  text: string;
  createdAt?: string;
};

type ThreadSummary = {
  threadId: string;
  lastMessageAt: string;
  lastMessageText: string;
};

function mergeMessages(current: Message[], incoming: Message[]) {
  const byId = new Map(current.map((message) => [message.id, message]));
  for (const message of incoming) {
    byId.set(message.id, message);
  }

  return Array.from(byId.values()).sort((left, right) =>
    (left.createdAt ?? "").localeCompare(right.createdAt ?? ""),
  );
}

function upsertThread(current: ThreadSummary[], nextThread: ThreadSummary) {
  const next = current.filter((item) => item.threadId !== nextThread.threadId);
  return [nextThread, ...next].sort((left, right) =>
    right.lastMessageAt.localeCompare(left.lastMessageAt),
  );
}

type ChatPanelProps = {
  onClose?: () => void;
  mobile?: boolean;
  userId?: string;
};

export function ChatPanel({ onClose, mobile = false, userId }: ChatPanelProps) {
  const router = useRouter();
  const { activeUser, accessToken, getAccessToken } = useAuth();
  const { setToast } = useToast();
  const chatPanelService = useMemo(() => createChatPanelService(), []);
  const resolvedUserId = activeUser?.uid ?? userId ?? "";
  const [draft, setDraft] = useState("");
  const [threadId, setThreadId] = useState(() =>
    typeof crypto !== "undefined" ? crypto.randomUUID() : "local-thread",
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!resolvedUserId) {
      setThreads([]);
      return;
    }

    const controller = new AbortController();

    async function loadThreads() {
      const items = await chatPanelService.listThreads(resolvedUserId);
      if (!controller.signal.aborted) {
        setThreads(
          items
            .map((item) => ({
              threadId: item.threadId,
              lastMessageAt: item.lastMessageAt,
              lastMessageText: item.lastMessageText,
            }))
            .sort((left, right) => right.lastMessageAt.localeCompare(left.lastMessageAt)),
        );
      }
    }

    void loadThreads().catch((error) => {
      if (
        !(error instanceof DOMException && error.name === "AbortError") &&
        !controller.signal.aborted
      ) {
        setToast("Could not load your chat threads.", "danger", 2500);
      }
    });

    return () => {
      controller.abort();
    };
  }, [chatPanelService, resolvedUserId, setToast]);

  useEffect(() => {
    if (!resolvedUserId) {
      return;
    }

    return chatPanelService.subscribeToThreads(resolvedUserId, (thread) => {
      setThreads((current) =>
        upsertThread(current, {
          threadId: thread.threadId,
          lastMessageAt: thread.lastMessageAt,
          lastMessageText: thread.lastMessageText,
        }),
      );
    });
  }, [chatPanelService, resolvedUserId]);

  useEffect(() => {
    if (!resolvedUserId) {
      setMessages([]);
      return;
    }

    const controller = new AbortController();

    async function loadHistory() {
      const items = await chatPanelService.listMessages(resolvedUserId, threadId);
      if (!controller.signal.aborted) {
        setMessages(
          items
            .map((item) => ({
              id: item.id,
              role: item.role,
              text: item.text,
              createdAt: item.createdAt ?? undefined,
            }))
            .sort((left, right) => (left.createdAt ?? "").localeCompare(right.createdAt ?? "")),
        );
      }
    }

    void loadHistory().catch((error) => {
      if (
        !(error instanceof DOMException && error.name === "AbortError") &&
        !controller.signal.aborted
      ) {
        setToast("Could not load this thread.", "danger", 2500);
        setMessages([]);
      }
    });

    return () => {
      controller.abort();
    };
  }, [chatPanelService, resolvedUserId, setToast, threadId]);

  useEffect(() => {
    if (!resolvedUserId || !threadId) {
      return;
    }

    return chatPanelService.subscribeToMessages(resolvedUserId, threadId, (message) => {
      setMessages((current) =>
        mergeMessages(current, [
          {
            id: message.id,
            role: message.role,
            text: message.text,
            createdAt: message.createdAt ?? undefined,
          },
        ]),
      );
    });
  }, [chatPanelService, resolvedUserId, threadId]);

  async function send() {
    const text = draft.trim();
    if (!text) {
      return;
    }

    const currentUser = activeUser;
    if (!currentUser) {
      router.push("/login?next=/chat");
      return;
    }

    const currentUserId = currentUser?.uid ?? userId ?? "";
    if (!currentUserId) {
      return;
    }

    setIsLoading(true);
    try {
      const now = new Date().toISOString();
      const userMessageId =
        typeof crypto !== "undefined" ? crypto.randomUUID() : `${threadId}-u-${Date.now()}`;

      await chatPanelService.createUserMessage({
        id: userMessageId,
        threadId,
        userId: currentUserId,
        role: "user",
        text,
        createdAt: now,
      });

      await chatPanelService.saveThread({
        threadId,
        userId: currentUserId,
        lastMessageAt: now,
        lastMessageText: text,
      });

      setMessages((current) =>
        mergeMessages(current, [
          {
            id: userMessageId,
            role: "user",
            text,
            createdAt: now,
          },
        ]),
      );
      setThreads((current) =>
        upsertThread(current, {
          threadId,
          lastMessageAt: now,
          lastMessageText: text,
        }),
      );
      setDraft("");

      const bearerToken = accessToken ?? (await getAccessToken());
      if (!bearerToken) {
        throw new Error("Missing access token.");
      }

      const data = await chatPanelService.respond({
        accessToken: bearerToken,
        threadId,
        text,
        userId: currentUserId,
      });

      const assistantAnswer = data.answer;
      if (assistantAnswer) {
        setMessages((current) =>
          mergeMessages(current, [
            {
              id: data.messageId ?? `${threadId}-a-${Date.now()}`,
              role: "assistant",
              text: assistantAnswer,
              createdAt: new Date().toISOString(),
            },
          ]),
        );
      }

      const nextThread = data.thread;
      if (nextThread) {
        setThreads((current) =>
          upsertThread(current, {
            threadId: nextThread.threadId,
            lastMessageAt: nextThread.lastMessageAt,
            lastMessageText: nextThread.lastMessageText,
          }),
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Chat request failed.";
      setMessages((current) => [
        ...current,
        {
          id: `${threadId}-e-${Date.now()}`,
          role: "assistant",
          text: message,
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleNewThread() {
    const nextThreadId = typeof crypto !== "undefined" ? crypto.randomUUID() : `thread-${Date.now()}`;
    setThreadId(nextThreadId);
    setMessages([]);
  }

  return (
    <aside className={`${styles.panel} ${mobile ? styles.mobile : ""}`.trim()}>
      <div className={styles.topBar}>
        <Button onClick={handleNewThread} variant="ghost">
          <FontAwesomeIcon icon={faPlus} style={{ marginRight: "0.35rem" }} />{" "}
          New Thread
        </Button>
        {onClose ? (
          <Button onClick={onClose} variant="ghost">
            <FontAwesomeIcon icon={faXmark} style={{ marginRight: "0.35rem" }} />{" "}
            Close
          </Button>
        ) : null}
      </div>

      {!activeUser ? (
        <div className={styles.authPrompt}>
          <p>Sign in to start chatting.</p>
          <div className={styles.authActions}>
            <Button onClick={() => router.push("/login?next=/chat")} type="button">
              Login
            </Button>
            <Button onClick={() => router.push("/register?next=/chat")} type="button" variant="ghost">
              Register
            </Button>
          </div>
        </div>
      ) : null}

      <div className={styles.threads}>
        {threads.length === 0 ? (
          <button className={styles.threadButton} onClick={handleNewThread} type="button">
            Start a thread
          </button>
        ) : (
          threads.map((thread) => (
            <button
              className={styles.threadButton}
              key={thread.threadId}
              onClick={() => setThreadId(thread.threadId)}
              type="button"
            >
              {thread.lastMessageText
                ? thread.lastMessageText.slice(0, 24)
                : "Open thread"}
            </button>
          ))
        )}
      </div>

      <div className={styles.messages}>
        {messages.map((message) => (
          <div
            className={`${styles.bubble} ${message.role === "user" ? styles.client : styles.ai}`.trim()}
            key={message.id}
          >
            {message.text}
          </div>
        ))}
      </div>

      <div className={styles.compose}>
        <div className={styles.composeRow}>
          <textarea
            className={styles.input}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Message"
            rows={3}
            value={draft}
          />
        </div>
        <div className={styles.composeRow}>
          <button
            className={styles.iconButton}
            type="button"
            aria-label="Attach file"
          >
            <FontAwesomeIcon icon={faPaperclip} />
          </button>
          <button
            className={styles.iconButton}
            type="button"
            aria-label="Voice input"
          >
            <FontAwesomeIcon icon={faMicrophone} />
          </button>
          <button
            className={styles.iconButton}
            type="button"
            aria-label="Loading indicator"
            disabled={!isLoading}
          >
            {isLoading ? <FontAwesomeIcon icon={faCircleNotch} spin /> : null}
          </button>
          <Button
            disabled={isLoading}
            onClick={send}
            type="button"
            aria-label="Send message"
          >
            <FontAwesomeIcon
              icon={faPaperPlane}
              style={{ marginRight: "0.35rem" }}
            />{" "}
            Send
          </Button>
        </div>
      </div>
    </aside>
  );
}
