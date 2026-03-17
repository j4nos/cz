"use client";

import { useEffect, useState } from "react";
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

type ChatPanelProps = {
  onClose?: () => void;
  mobile?: boolean;
  userId?: string;
};

export function ChatPanel({ onClose, mobile = false, userId }: ChatPanelProps) {
  const { activeUser, ensureAnonymous } = useAuth();
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

    async function loadThreads() {
      const response = await fetch(`/api/chat?userId=${encodeURIComponent(resolvedUserId)}&listThreads=1`);
      if (!response.ok) {
        return;
      }
      const data = (await response.json()) as { threads?: ThreadSummary[] };
      setThreads(data.threads ?? []);
    }

    void loadThreads();
  }, [resolvedUserId]);

  useEffect(() => {
    if (!resolvedUserId) {
      setMessages([]);
      return;
    }

    async function loadHistory() {
      const response = await fetch(
        `/api/chat?userId=${encodeURIComponent(resolvedUserId)}&threadId=${encodeURIComponent(threadId)}`,
      );
      if (!response.ok) {
        setMessages([]);
        return;
      }

      const data = (await response.json()) as { messages?: Message[] };
      setMessages(data.messages ?? []);
    }

    void loadHistory();
  }, [resolvedUserId, threadId]);

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
      };
      if (!response.ok) {
        throw new Error(data.error || "Chat request failed.");
      }

      const now = new Date().toISOString();
      setMessages((current) => [
        ...current,
        { id: `${threadId}-u-${now}`, role: "user", text, createdAt: now },
        { id: `${threadId}-a-${now}`, role: "assistant", text: data.answer ?? "", createdAt: now },
      ]);
      setDraft("");

      if (data.thread) {
        const nextThread = data.thread;
        setThreads((current) => {
          const next = current.filter((item) => item.threadId !== nextThread.threadId);
          return [nextThread, ...next];
        });
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
