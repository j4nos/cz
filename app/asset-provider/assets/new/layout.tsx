import type { ReactNode } from "react";

import { AssetWizardProvider } from "@/contexts/asset-wizard-context";
import { StepNavigation } from "@/components/navigation/StepNavigation";

const steps = [
  { href: "/asset-provider/assets/new/step-1", label: "Step 1 - Details" },
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
