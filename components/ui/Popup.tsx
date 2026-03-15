"use client";

import { useEffect, type ReactNode } from "react";

import styles from "./Popup.module.css";

type PopupProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  width?: string | number;
  height?: string | number;
  showCloseButton?: boolean;
};

export function Popup({
  open,
  onClose,
  children,
  title,
  width = 400,
  height = "auto",
  showCloseButton = true,
}: PopupProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        aria-modal="true"
        className={styles.popup}
        style={{ width, height }}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        {showCloseButton ? (
          <button
            aria-label="Close popup"
            className={styles.close}
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        ) : null}
        {title ? <h2 className={styles.title}>{title}</h2> : null}
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}
