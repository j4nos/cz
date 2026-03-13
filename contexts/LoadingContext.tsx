"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

type LoadingContextValue = {
  isLoading: boolean;
  setLoading: (key: string, value: boolean) => void;
};

const LoadingContext = createContext<LoadingContextValue | undefined>(undefined);

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [counts, setCounts] = useState<Record<string, number>>({});

  const setLoading = useCallback((key: string, value: boolean) => {
    if (!key) {
      return;
    }

    setCounts((current) => {
      const nextValue = value ? (current[key] ?? 0) + 1 : Math.max(0, (current[key] ?? 0) - 1);
      const next = { ...current };
      if (nextValue === 0) {
        delete next[key];
      } else {
        next[key] = nextValue;
      }
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      isLoading: Object.values(counts).some((count) => count > 0),
      setLoading,
    }),
    [counts, setLoading],
  );

  return <LoadingContext.Provider value={value}>{children}</LoadingContext.Provider>;
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error("useLoading must be used within LoadingProvider.");
  }

  return context;
}
