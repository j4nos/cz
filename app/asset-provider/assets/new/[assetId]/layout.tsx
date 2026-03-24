import type { ReactNode } from "react";

import { StepNavigation } from "@/components/navigation/StepNavigation";
import { AssetWizardProvider } from "@/contexts/asset-wizard-context";

const buildSteps = (assetId: string) => [
  { href: "/asset-provider/assets/new/step-1", label: "Step 1 - Details" },
  { href: `/asset-provider/assets/new/${assetId}/step-2`, label: "Step 2 - Media" },
  { href: `/asset-provider/assets/new/${assetId}/step-3`, label: "Step 3 - Documents" },
  { href: `/asset-provider/assets/new/${assetId}/step-4`, label: "Step 4 - Review" },
];

export default function AssetWizardAssetLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { assetId: string };
}) {
  return (
    <AssetWizardProvider>
      <div className="vertical-stack-with-gap">
        <StepNavigation
          steps={buildSteps(params.assetId)}
          ariaLabel="Asset creation steps"
        />
        {children}
      </div>
    </AssetWizardProvider>
  );
}
