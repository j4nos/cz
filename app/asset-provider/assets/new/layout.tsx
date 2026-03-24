import type { ReactNode } from "react";

import { AssetWizardProvider } from "@/contexts/asset-wizard-context";
import { AssetWizardStepNav } from "@/app/asset-provider/assets/new/AssetWizardStepNav";

export default function AssetWizardLayout({ children }: { children: ReactNode }) {
  return (
    <AssetWizardProvider>
      <div className="vertical-stack-with-gap">
        <AssetWizardStepNav />
        {children}
      </div>
    </AssetWizardProvider>
  );
}
