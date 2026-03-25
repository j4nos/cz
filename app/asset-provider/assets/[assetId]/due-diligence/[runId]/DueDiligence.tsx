"use client";

import { useEffect, useState } from "react";

import { useLoading } from "@/contexts/LoadingContext";
import {
  getDueDiligenceRun,
  type DueDiligenceRunView,
} from "@/src/presentation/composition/client";

type Props = {
  runId: string;
};

export function DueDiligence({ runId }: Props) {
  const { setLoading } = useLoading();
  const [run, setRun] = useState<DueDiligenceRunView | null>(null);

  useEffect(() => {
    async function load() {
      setLoading("due-diligence", true);
      try {
        setRun(await getDueDiligenceRun(runId));
      } finally {
        setLoading("due-diligence", false);
      }
    }

    void load();
  }, [runId, setLoading]);

  if (!run) {
    return null;
  }

  return (
    <>
      <h1>Due diligence</h1>
      <p>Status: {run.status}</p>
      <p>Risk score: {run.riskScore}</p>
      <p>Executed at: {run.executedAt}</p>
      <p>Ready: {run.ready ? "Yes" : "No"}</p>
      <p>Missing: {run.missingSummary}</p>
    </>
  );
}
