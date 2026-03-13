import type { ReactNode } from "react";

import { AssetWizardProvider } from "@/contexts/asset-wizard-context";
import { StepNavigation } from "@/components/navigation/StepNavigation";

const steps = [
  { href: "/asset-provider/assets/new/step-1", label: "Step 1 - Details" },
  { href: "/asset-provider/assets/new/step-2", label: "Step 2 - Media" },
  { href: "/asset-provider/assets/new/step-3", label: "Step 3 - Documents" },
  { href: "/asset-provider/assets/new/step-4", label: "Step 4 - Review" },
];

export default function AssetWizardLayout({ children }: { children: ReactNode }) {
  return (
    <AssetWizardProvider>
      <div className="vertical-stack-with-gap">
        <StepNavigation steps={steps} ariaLabel="Asset creation steps" />
        {children}
      </div>
    </AssetWizardProvider>
  );
}
