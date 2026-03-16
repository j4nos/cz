"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { KeyValueList } from "@/components/ui/KeyValueList";
import { useAssetWizard } from "@/contexts/asset-wizard-context";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import type { Asset } from "@/src/domain/entities";
import { createReadController } from "@/src/infrastructure/controllers/createReadController";

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
  const { activeUser, accessToken } = useAuth();
  const { setToast } = useToast();
  const { state, updateState, resetState } = useAssetWizard();
  const readController = useMemo(() => createReadController(), []);
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

      const loadedAsset = await readController.getAssetById(effectiveAssetId);
      setAsset(loadedAsset);

      if (loadedAsset) {
        updateState({
          assetId: loadedAsset.id,
          name: loadedAsset.name,
          country: loadedAsset.country,
          assetClass: loadedAsset.assetClass,
          tokenStandard: loadedAsset.tokenStandard ?? state.tokenStandard ?? "ERC-20",
        });
      }
    }

    void load();
  }, [effectiveAssetId, readController, state.tokenStandard, updateState]);

  if (!effectiveAssetId) {
    return (
      <p className="muted">Missing assetId. Complete earlier steps first.</p>
    );
  }

  if (!activeUser) {
    return <p className="muted">Login to submit.</p>;
  }

  async function submitAsset() {
    setSubmitting(true);

    try {
      if (!accessToken) {
        setToast("Login required to deploy contract.", "danger", 2500);
        return;
      }

      const response = await fetch("/api/assets/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          assetId: effectiveAssetId,
          name: state.name,
          country: state.country,
          assetClass: state.assetClass,
          tokenStandard: state.tokenStandard,
        }),
      });
      const result = (await response.json().catch(() => ({}))) as {
        asset?: Asset;
        error?: string;
      };
      if (!response.ok || !result.asset) {
        throw new Error(result.error || "Failed to submit asset.");
      }

      setAsset(result.asset);
      resetState();
      setToast("Asset submitted with contract.", "success", 2500);
      router.push(`/asset-provider/assets/${result.asset.id}`);
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
  const displayTokenStandard = state.tokenStandard || "ERC-20";
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
