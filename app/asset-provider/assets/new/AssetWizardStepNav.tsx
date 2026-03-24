"use client";

import { usePathname } from "next/navigation";

import { StepNavigation } from "@/components/navigation/StepNavigation";

function readAssetIdFromPath(pathname: string | null): string | null {
  if (!pathname) {
    return null;
  }

  const match = pathname.match(
    /^\/asset-provider\/assets\/new\/([^/]+)\/step-[234]$/,
  );
  return match?.[1] ?? null;
}

export function AssetWizardStepNav() {
  const pathname = usePathname();
  const assetId = readAssetIdFromPath(pathname);

  const steps = assetId
    ? [
        { href: "/asset-provider/assets/new/step-1", label: "Step 1 - Details" },
        {
          href: `/asset-provider/assets/new/${assetId}/step-2`,
          label: "Step 2 - Media",
        },
        {
          href: `/asset-provider/assets/new/${assetId}/step-3`,
          label: "Step 3 - Documents",
        },
        {
          href: `/asset-provider/assets/new/${assetId}/step-4`,
          label: "Step 4 - Review",
        },
      ]
    : [{ href: "/asset-provider/assets/new/step-1", label: "Step 1 - Details" }];

  return <StepNavigation steps={steps} ariaLabel="Asset creation steps" />;
}
