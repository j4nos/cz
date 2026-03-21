"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { KeyValueList } from "@/components/ui/KeyValueList";
import { useAssetWizard } from "@/contexts/asset-wizard-context";
import { useAuth } from "@/contexts/AuthContext";
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
  const { user, accessToken } = useAuth();
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

  if (!user) {
    return <p className="muted">Login to submit.</p>;
  }

  async function submitAsset() {
    if (!effectiveAssetId) {
      setToast("Missing assetId. Complete earlier steps first.", "danger", 2000);
      return;
    }

    if (!user) {
      setToast("Login required.", "danger", 2000);
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
      let tokenAddress = asset?.tokenAddress;

      if (!tokenAddress) {
        if (!accessToken) {
          setToast("Login required to tokenize assets.", "danger", 2500);
          setSubmitting(false);
          return;
        }

        setToast("Deploying asset token...", "warning", 2000);
        const symbol =
          nameValue.replace(/\W+/g, "").toUpperCase().slice(0, 6) || "ASSET";
        const response = await fetch("/api/tokenize-asset", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            assetId: effectiveAssetId,
            name: nameValue,
            symbol,
            tokenStandard: desiredStandard,
          }),
        });

        if (!response.ok) {
          const result = (await response.json().catch(() => ({}))) as { error?: string };
          throw new Error(result.error || "Token deployment failed. Please try again.");
        }

        const result = (await response.json()) as { address: string };
        tokenAddress = result.address;
      }

      const repository = createInvestmentRepository();
      const baseAsset: Asset = asset
        ? {
            ...asset,
            name: nameValue,
            country: countryValue,
            assetClass: assetClassValue,
            tokenStandard: desiredStandard,
            missingDocsCount: asset.missingDocsCount ?? 0,
          }
        : {
            id: effectiveAssetId,
            tenantUserId: user.uid,
            name: nameValue,
            country: countryValue,
            assetClass: assetClassValue,
            tokenStandard: desiredStandard,
            status: "draft",
            missingDocsCount: 0,
            imageUrls: [],
          };

      const savedAsset = await repository.updateAsset({
        ...baseAsset,
        tokenAddress,
        status: "submitted",
      });

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
