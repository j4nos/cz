"use client";

import { useEffect, useMemo, useState } from "react";
import { generateClient } from "aws-amplify/data";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleNotch,
  faMicrophone,
  faPaperPlane,
  faPaperclip,
  faPlus,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";

import type { Schema } from "@/amplify/data/resource";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { ensureAmplifyConfigured } from "@/src/config/amplify";
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
  const { activeUser, ensureAnonymous } = useAuth();
  const { setToast } = useToast();
  const client = useMemo(() => {
    ensureAmplifyConfigured();
    return generateClient<Schema>();
  }, []);
  const resolvedUserId = activeUser?.uid ?? userId ?? "";
  const [draft, setDraft] = useState("");
  const [threadId, setThreadId] = useState(() =>
    typeof crypto !== "undefined" ? crypto.randomUUID() : "local-thread",
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (activeUser || userId) {
      return;
    }

    void ensureAnonymous().catch(() => {
      // Keep silent here; send() will surface a user-facing error if needed.
    });
  }, [activeUser, ensureAnonymous, userId]);

  useEffect(() => {
    if (!resolvedUserId) {
      setThreads([]);
      return;
    }

    const controller = new AbortController();

    async function loadThreads() {
      const response = await fetch(`/api/chat?userId=${encodeURIComponent(resolvedUserId)}&listThreads=1`, {
        signal: controller.signal,
      });
      if (!response.ok) {
        if (!controller.signal.aborted) {
          setToast("Could not load your chat threads.", "danger", 2500);
        }
        return;
      }
      const data = (await response.json()) as { threads?: ThreadSummary[] };
      if (!controller.signal.aborted) {
        setThreads(
          (data.threads ?? []).sort((left, right) =>
            right.lastMessageAt.localeCompare(left.lastMessageAt),
          ),
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
  }, [resolvedUserId, setToast]);

  useEffect(() => {
    if (!resolvedUserId) {
      return;
    }

    const onCreateSubscription = client.models.UserThread.onCreate({
      authMode: "apiKey",
      filter: { userId: { eq: resolvedUserId } },
    }).subscribe({
      next: ({ id, lastMessageAt, lastMessageText }) => {
        setThreads((current) =>
          upsertThread(current, {
            threadId: id,
            lastMessageAt: lastMessageAt ?? "",
            lastMessageText: lastMessageText ?? "",
          }),
        );
      },
    });

    const onUpdateSubscription = client.models.UserThread.onUpdate({
      authMode: "apiKey",
      filter: { userId: { eq: resolvedUserId } },
    }).subscribe({
      next: ({ id, lastMessageAt, lastMessageText }) => {
        setThreads((current) =>
          upsertThread(current, {
            threadId: id,
            lastMessageAt: lastMessageAt ?? "",
            lastMessageText: lastMessageText ?? "",
          }),
        );
      },
    });

    return () => {
      onCreateSubscription.unsubscribe();
      onUpdateSubscription.unsubscribe();
    };
  }, [client, resolvedUserId]);

  useEffect(() => {
    if (!resolvedUserId) {
      setMessages([]);
      return;
    }

    const controller = new AbortController();

    async function loadHistory() {
      const response = await fetch(
        `/api/chat?userId=${encodeURIComponent(resolvedUserId)}&threadId=${encodeURIComponent(threadId)}`,
        { signal: controller.signal },
      );
      if (!response.ok) {
        if (!controller.signal.aborted) {
          setToast("Could not load this thread.", "danger", 2500);
          setMessages([]);
        }
        return;
      }

      const data = (await response.json()) as { messages?: Message[] };
      if (!controller.signal.aborted) {
        setMessages(data.messages ?? []);
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
  }, [resolvedUserId, setToast, threadId]);

  useEffect(() => {
    if (!resolvedUserId || !threadId) {
      return;
    }

    const subscription = client.models.UserMessage.onCreate({
      authMode: "apiKey",
      filter: {
        userId: { eq: resolvedUserId },
        threadId: { eq: threadId },
      },
    }).subscribe({
      next: (message) => {
        setMessages((current) =>
          mergeMessages(current, [
            {
              id: message.id,
              role: (message.role as Message["role"]) ?? "user",
              text: message.text ?? "",
              createdAt: message.createdAt ?? undefined,
            },
          ]),
        );
      },
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [client, resolvedUserId, threadId]);

  async function send() {
    const text = draft.trim();
    if (!text) {
      return;
    }

    let currentUser = activeUser;
    if (!currentUser) {
      try {
        currentUser = await ensureAnonymous();
      } catch (error) {
        const message = error instanceof Error ? error.message : "Could not start anonymous chat.";
        setMessages((current) => [
          ...current,
          { id: `${threadId}-e-${Date.now()}`, role: "assistant", text: message, createdAt: new Date().toISOString() },
        ]);
        return;
      }
    }

    const currentUserId = currentUser?.uid ?? userId ?? "";
    if (!currentUserId) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          threadId,
          input: text,
          userId: currentUserId,
        }),
      });

      const data = (await response.json()) as {
        answer?: string;
        error?: string;
        thread?: ThreadSummary;
        messageIds?: string[];
      };
      if (!response.ok) {
        throw new Error(data.error || "Chat request failed.");
      }

      const now = new Date().toISOString();
      setMessages((current) =>
        mergeMessages(current, [
          {
            id: data.messageIds?.[0] ?? `${threadId}-u-${now}`,
            role: "user",
            text,
            createdAt: now,
          },
          {
            id: data.messageIds?.[1] ?? `${threadId}-a-${now}`,
            role: "assistant",
            text: data.answer ?? "",
            createdAt: now,
          },
        ]),
      );
      setDraft("");

      if (data.thread) {
        const nextThread = data.thread;
        setThreads((current) => upsertThread(current, nextThread));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Chat request failed.";
      setMessages((current) => [
        ...current,
        { id: `${threadId}-e-${Date.now()}`, role: "assistant", text: message, createdAt: new Date().toISOString() },
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
