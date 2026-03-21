import { DueDiligence } from "./DueDiligence";

export default function DueDiligencePage({
  params,
}: {
  params: { assetId: string; runId: string };
}) {
  return <DueDiligence runId={params.runId} />;
}
