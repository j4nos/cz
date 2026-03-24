import { notFound } from "next/navigation";

import { Step3PageContent } from "@/app/asset-provider/assets/new/Step3PageContent";

export default function AssetWizardStep3Page({
  params,
}: {
  params: { assetId?: string };
}) {
  if (!params.assetId) {
    notFound();
  }

  return <Step3PageContent assetId={params.assetId} />;
}
