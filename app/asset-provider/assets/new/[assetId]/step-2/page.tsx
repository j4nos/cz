import { notFound } from "next/navigation";

import { Step2PageContent } from "@/app/asset-provider/assets/new/Step2PageContent";

export default function AssetWizardStep2Page({
  params,
}: {
  params: { assetId?: string };
}) {
  if (!params.assetId) {
    notFound();
  }

  return <Step2PageContent assetId={params.assetId} />;
}
