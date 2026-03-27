"use client";

import { useEffect, useMemo, useReducer } from "react";
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

type ChatPanelState = {
  draft: string;
  threadId: string;
  messages: Message[];
  threads: ThreadSummary[];
  isLoading: boolean;
};

type ChatPanelAction =
  | { type: "set_draft"; payload: string }
  | { type: "set_thread_id"; payload: string }
  | { type: "replace_threads"; payload: ThreadSummary[] }
  | { type: "replace_messages"; payload: Message[] }
  | { type: "merge_messages"; payload: Message[] }
  | { type: "upsert_thread"; payload: ThreadSummary }
  | { type: "set_loading"; payload: boolean }
  | { type: "start_new_thread"; payload: string }
  | { type: "clear_threads" }
  | { type: "clear_messages" };

function createInitialChatPanelState(): ChatPanelState {
  return {
    draft: "",
    threadId: typeof crypto !== "undefined" ? crypto.randomUUID() : "local-thread",
    messages: [],
    threads: [],
    isLoading: false,
  };
}

function chatPanelReducer(state: ChatPanelState, action: ChatPanelAction): ChatPanelState {
  switch (action.type) {
    case "set_draft":
      return { ...state, draft: action.payload };
    case "set_thread_id":
      return { ...state, threadId: action.payload };
    case "replace_threads":
      return { ...state, threads: action.payload };
    case "replace_messages":
      return { ...state, messages: action.payload };
    case "merge_messages":
      return { ...state, messages: mergeMessages(state.messages, action.payload) };
    case "upsert_thread":
      return { ...state, threads: upsertThread(state.threads, action.payload) };
    case "set_loading":
      return { ...state, isLoading: action.payload };
    case "start_new_thread":
      return { ...state, threadId: action.payload, messages: [] };
    case "clear_threads":
      return { ...state, threads: [] };
    case "clear_messages":
      return { ...state, messages: [] };
    default:
      return state;
  }
}

export function ChatPanel({ onClose, mobile = false, userId }: ChatPanelProps) {
  const router = useRouter();
  const { activeUser, accessToken, getAccessToken } = useAuth();
  const { setToast } = useToast();
  const chatPanelService = useMemo(() => createChatPanelService(), []);
  const resolvedUserId = activeUser?.uid ?? userId ?? "";
  const [state, dispatch] = useReducer(chatPanelReducer, undefined, createInitialChatPanelState);
  const { draft, threadId, messages, threads, isLoading } = state;

  useEffect(() => {
    if (!resolvedUserId) {
      dispatch({ type: "clear_threads" });
      return;
    }

    const controller = new AbortController();

    async function loadThreads() {
      const items = await chatPanelService.listThreads(resolvedUserId);
      if (!controller.signal.aborted) {
        dispatch({
          type: "replace_threads",
          payload: items
            .map((item) => ({
              threadId: item.threadId,
              lastMessageAt: item.lastMessageAt,
              lastMessageText: item.lastMessageText,
            }))
            .sort((left, right) => right.lastMessageAt.localeCompare(left.lastMessageAt)),
        });
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
      dispatch({
        type: "upsert_thread",
        payload: {
          threadId: thread.threadId,
          lastMessageAt: thread.lastMessageAt,
          lastMessageText: thread.lastMessageText,
        },
      });
    });
  }, [chatPanelService, resolvedUserId]);

  useEffect(() => {
    if (!resolvedUserId) {
      dispatch({ type: "clear_messages" });
      return;
    }

    const controller = new AbortController();

    async function loadHistory() {
      const items = await chatPanelService.listMessages(resolvedUserId, threadId);
      if (!controller.signal.aborted) {
        dispatch({
          type: "replace_messages",
          payload: items
            .map((item) => ({
              id: item.id,
              role: item.role,
              text: item.text,
              createdAt: item.createdAt ?? undefined,
            }))
            .sort((left, right) => (left.createdAt ?? "").localeCompare(right.createdAt ?? "")),
        });
      }
    }

    void loadHistory().catch((error) => {
      if (
        !(error instanceof DOMException && error.name === "AbortError") &&
        !controller.signal.aborted
      ) {
        setToast("Could not load this thread.", "danger", 2500);
        dispatch({ type: "clear_messages" });
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
      dispatch({
        type: "merge_messages",
        payload: [
          {
            id: message.id,
            role: message.role,
            text: message.text,
            createdAt: message.createdAt ?? undefined,
          },
        ],
      });
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

    dispatch({ type: "set_loading", payload: true });
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

      dispatch({
        type: "merge_messages",
        payload: [
          {
            id: userMessageId,
            role: "user",
            text,
            createdAt: now,
          },
        ],
      });
      dispatch({
        type: "upsert_thread",
        payload: {
          threadId,
          lastMessageAt: now,
          lastMessageText: text,
        },
      });
      dispatch({ type: "set_draft", payload: "" });

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
        dispatch({
          type: "merge_messages",
          payload: [
            {
              id: data.messageId ?? `${threadId}-a-${Date.now()}`,
              role: "assistant",
              text: assistantAnswer,
              createdAt: new Date().toISOString(),
            },
          ],
        });
      }

      const nextThread = data.thread;
      if (nextThread) {
        dispatch({
          type: "upsert_thread",
          payload: {
            threadId: nextThread.threadId,
            lastMessageAt: nextThread.lastMessageAt,
            lastMessageText: nextThread.lastMessageText,
          },
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Chat request failed.";
      dispatch({
        type: "merge_messages",
        payload: [
          {
            id: `${threadId}-e-${Date.now()}`,
            role: "assistant",
            text: message,
            createdAt: new Date().toISOString(),
          },
        ],
      });
    } finally {
      dispatch({ type: "set_loading", payload: false });
    }
  }

  function handleNewThread() {
    const nextThreadId = typeof crypto !== "undefined" ? crypto.randomUUID() : `thread-${Date.now()}`;
    dispatch({ type: "start_new_thread", payload: nextThreadId });
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
              onClick={() => dispatch({ type: "set_thread_id", payload: thread.threadId })}
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
            onChange={(event) => dispatch({ type: "set_draft", payload: event.target.value })}
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
