"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { KeyValueList } from "@/components/ui/KeyValueList";
import { useAssetWizard } from "@/contexts/asset-wizard-context";
import { useToast } from "@/contexts/ToastContext";
import type { Asset } from "@/src/domain/entities";
import { createAuthClient } from "@/src/presentation/composition/client";

export function Step4PageContent({ assetId }: { assetId: string }) {
  const router = useRouter();
  const { setToast } = useToast();
  const { state, resetState } = useAssetWizard();
  const [submitting, setSubmitting] = useState(false);

  async function submitAsset() {
    const nameValue = state.name;
    const countryValue = state.country;
    const assetClassValue = state.assetClass;
    const desiredStandard = state.tokenStandard || "ERC-20";

    if (!nameValue || !countryValue || !assetClassValue) {
      setToast("Missing asset details. Complete previous steps.", "warning", 2000);
      return;
    }

    setSubmitting(true);

    try {
      const accessToken = await createAuthClient().getAccessToken();
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
          assetId,
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

  const displayName = state.name;
  const displayCountry = state.country;
  const displayAssetClass = state.assetClass;
  const displayTokenName = displayName;
  const displayTokenStandard = state.tokenStandard || "ERC-20";
  const displayStatus = "draft";
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
