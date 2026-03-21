"use client";

import { generateClient } from "aws-amplify/data";
import { useEffect, useState } from "react";

import type { Schema } from "@/amplify/data/resource";
import { useLoading } from "@/contexts/LoadingContext";
import { ensureAmplifyConfigured } from "@/src/config/amplify";

type Props = {
  runId: string;
};

type DueDiligenceRun = {
  id: string;
  status: string;
  riskScore?: number;
  executedAt?: string;
  ready: boolean;
  missingSummary?: string;
};

export function DueDiligence({ runId }: Props) {
  const { setLoading } = useLoading();
  const [run, setRun] = useState<DueDiligenceRun | null>(null);

  useEffect(() => {
    async function load() {
      setLoading("due-diligence", true);
      try {
        ensureAmplifyConfigured();
        const client = generateClient<Schema>();
        const response = await client.models.DueDiligenceRun.get({ id: runId });
        if (!response.data) {
          setRun(null);
          return;
        }

        setRun({
          id: response.data.id,
          status: response.data.status ?? "",
          riskScore:
            response.data.riskScore == null
              ? undefined
              : Number(response.data.riskScore),
          executedAt: response.data.executedAt ?? undefined,
          ready: Boolean(response.data.ready),
          missingSummary: response.data.missingSummary ?? undefined,
        });
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
