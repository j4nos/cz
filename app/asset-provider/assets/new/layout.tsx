import Link from "next/link";
import type { ReactNode } from "react";

import { AssetWizardProvider } from "@/contexts/asset-wizard-context";

export default function AssetWizardLayout({ children }: { children: ReactNode }) {
  return (
    <AssetWizardProvider>
      <section>
        <nav>
          <Link href="/asset-provider/assets/new/step-1">Step 1</Link> <Link href="/asset-provider/assets/new/step-2">Step 2</Link>{" "}
          <Link href="/asset-provider/assets/new/step-3">Step 3</Link> <Link href="/asset-provider/assets/new/step-4">Step 4</Link>
        </nav>
        {children}
      </section>
    </AssetWizardProvider>
  );
}
