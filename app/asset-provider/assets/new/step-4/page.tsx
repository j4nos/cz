"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { KeyValueList } from "@/components/ui/KeyValueList";
import { useAssetWizard } from "@/contexts/asset-wizard-context";
import { usePrivateAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import type { Asset } from "@/src/domain/entities";
import { createInvestmentRepository } from "@/src/infrastructure/composition/defaults";

export default function AssetWizardStep4Page() {
  return (
    <Suspense fallback={null}>
      <Step4Content />
    </Suspense>
  );
}

function Step4Content() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { accessToken } = usePrivateAuth();
  const { setToast } = useToast();
  const { state, updateState, resetState } = useAssetWizard();
  const assetId = searchParams.get("assetId");
  const effectiveAssetId = assetId || state.assetId;
  const [asset, setAsset] = useState<Asset | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      if (!effectiveAssetId) {
        setAsset(null);
        return;
      }

      const loadedAsset = await createInvestmentRepository().getAssetById(effectiveAssetId);
      setAsset(loadedAsset);

      if (loadedAsset) {
        updateState({
          assetId: loadedAsset.id,
          name: loadedAsset.name,
          country: loadedAsset.country,
          assetClass: loadedAsset.assetClass,
          tokenStandard:
            loadedAsset.tokenStandard === "ERC-20" ||
            loadedAsset.tokenStandard === "ERC-721"
              ? loadedAsset.tokenStandard
              : state.tokenStandard ?? "ERC-20",
        });
      }
    }

    void load();
  }, [effectiveAssetId, state.tokenStandard, updateState]);

  if (!effectiveAssetId) {
    return (
      <p className="muted">Missing assetId. Complete earlier steps first.</p>
    );
  }

  async function submitAsset() {
    if (!effectiveAssetId) {
      setToast("Missing assetId. Complete earlier steps first.", "danger", 2000);
      return;
    }

    const nameValue = asset?.name || state.name;
    const countryValue = asset?.country || state.country;
    const assetClassValue = asset?.assetClass || state.assetClass;
    const desiredStandard = state.tokenStandard || asset?.tokenStandard || "ERC-20";

    if (!nameValue || !countryValue || !assetClassValue) {
      setToast("Missing asset details. Complete previous steps.", "warning", 2000);
      return;
    }

    setSubmitting(true);

    try {
      if (!accessToken) {
        setToast("Login required to submit assets.", "danger", 2500);
        setSubmitting(false);
        return;
      }

      setToast("Submitting asset...", "warning", 2000);
      const response = await fetch("/api/assets/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          assetId: effectiveAssetId,
          name: nameValue,
          country: countryValue,
          assetClass: assetClassValue,
          tokenStandard: desiredStandard,
        }),
      });

      if (!response.ok) {
        const result = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(result.error || "Failed to submit asset.");
      }

      const result = (await response.json()) as { asset?: Asset };
      const savedAsset = result.asset;
      if (!savedAsset) {
        throw new Error("Asset submission returned no asset.");
      }

      setAsset(savedAsset);
      resetState();
      setToast("Asset submitted with token.", "success", 2500);
      router.push(`/asset-provider/assets/${savedAsset.id}`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to submit asset.";
      setToast(message, "danger", 2500);
    } finally {
      setSubmitting(false);
    }
  }

  const displayName = asset?.name || state.name;
  const displayCountry = asset?.country || state.country;
  const displayAssetClass = asset?.assetClass || state.assetClass;
  const displayTokenName = displayName;
  const displayTokenStandard = state.tokenStandard || asset?.tokenStandard || "ERC-20";
  const displayStatus = asset?.status || "draft";
  const reviewItems = [
    {
      label: "Name",
      value: displayName ? displayName : <span className="muted">Missing</span>,
    },
    {
      label: "Country",
      value: displayCountry ? (
        displayCountry
      ) : (
        <span className="muted">Missing</span>
      ),
    },
    {
      label: "Asset class",
      value: displayAssetClass ? (
        displayAssetClass
      ) : (
        <span className="muted">Missing</span>
      ),
    },
    {
      label: "Token name",
      value: displayTokenName ? (
        displayTokenName
      ) : (
        <span className="muted">Missing</span>
      ),
    },
    { label: "Contract standard", value: displayTokenStandard.toUpperCase() },
    { label: "Status", value: displayStatus },
  ];

  return (
    <>
      <h1>Step 4 - Review</h1>
      <KeyValueList items={reviewItems} />
      <Button
        type="button"
        onClick={() => void submitAsset()}
        disabled={submitting}
      >
        {submitting ? "Submitting..." : "Submit asset"}
      </Button>
    </>
  );
}
