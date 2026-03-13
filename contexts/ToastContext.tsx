"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";

export type ToastTone = "success" | "warning" | "danger";

type ToastContextValue = {
  message: string | null;
  tone: ToastTone;
  isVisible: boolean;
  setToast: (message: string, tone?: ToastTone, durationMs?: number) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const [tone, setTone] = useState<ToastTone>("success");
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({
      message,
      tone,
      isVisible,
      setToast: (nextMessage, nextTone = "success", durationMs = 2200) => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        setMessage(nextMessage);
        setTone(nextTone);
        setIsVisible(true);
        timeoutRef.current = setTimeout(() => {
          setIsVisible(false);
          setMessage(null);
        }, durationMs);
      },
    }),
    [isVisible, message, tone],
  );

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider.");
  }

  return context;
}
