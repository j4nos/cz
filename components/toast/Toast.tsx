"use client";

import { useState } from "react";
import { useToast } from "@/contexts/ToastContext";
import styles from "./Toast.module.css";

export function Toast() {
  const { message, tone, isVisible } = useToast();
  const [copied, setCopied] = useState(false);

  if (!isVisible || !message) {
    return null;
  }
  const toastMessage = message;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(toastMessage);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className={styles.host} aria-live="polite" role="status">
      <span className={`${styles.toast} ${styles[tone]}`}>
        <span className={styles.message}>{toastMessage}</span>
        <button
          type="button"
          className={styles.copyButton}
          onClick={() => void handleCopy()}
          aria-label="Copy toast message"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </span>
    </div>
  );
}
