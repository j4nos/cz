export default function DueDiligencePage({ params }: { params: { assetId: string; runId: string } }) {
  return (
    <section>
      <h1>Due diligence result</h1>
      <p>Asset: {params.assetId}</p>
      <p>Run: {params.runId}</p>
    </section>
  );
}
