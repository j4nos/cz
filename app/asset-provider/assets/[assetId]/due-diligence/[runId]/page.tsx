import { notFound } from "next/navigation";
import { DueDiligence } from "./DueDiligence";

export default function DueDiligencePage({
  params,
}: {
  params: { assetId: string; runId: string };
}) {
  if (!params?.assetId || !params?.runId) {
    notFound();
  }

  return <DueDiligence runId={params.runId} />;
}
