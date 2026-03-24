import { notFound } from "next/navigation";

import { Step4PageContent } from "@/app/asset-provider/assets/new/Step4PageContent";

export default function AssetWizardStep4Page({
  params,
}: {
  params: { assetId?: string };
}) {
  if (!params.assetId) {
    notFound();
  }

  return <Step4PageContent assetId={params.assetId} />;
}
