"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { KeyValueList } from "@/components/ui/KeyValueList";
import { useAssetWizard } from "@/contexts/asset-wizard-context";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import type { Asset } from "@/src/domain/entities";
import { AmplifyInvestmentRepository } from "@/src/infrastructure/repositories/amplifyInvestmentRepository";

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
  const repository = useMemo(() => new AmplifyInvestmentRepository(), []);
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

      const next = await repository.getAssetById(effectiveAssetId);
      setAsset(next);

      if (next) {
        updateState({
          assetId: next.id,
          name: next.name,
          country: next.country,
          assetClass: next.assetClass,
          tokenStandard: next.tokenStandard ?? state.tokenStandard,
        });
      }
    }

    void load();
  }, [effectiveAssetId, repository, state.tokenStandard, updateState]);

  if (!effectiveAssetId) {
    return (
      <p className="muted">Missing assetId. Complete earlier steps first.</p>
    );
  }

  if (!activeUser) {
    return <p className="muted">Login to submit.</p>;
  }

  async function submitAsset() {
    if (!effectiveAssetId) {
      setToast(
        "Missing assetId. Complete earlier steps first.",
        "danger",
        2000
      );
      return;
    }

    if (!activeUser) {
      setToast("Login required.", "danger", 2000);
      return;
    }

    const nameValue = asset?.name || state.name;
    const countryValue = asset?.country || state.country;
    const assetClassValue = asset?.assetClass || state.assetClass;
    const tokenNameValue = nameValue;

    if (!nameValue || !countryValue || !assetClassValue || !tokenNameValue) {
      setToast(
        "Missing asset details. Complete previous steps.",
        "warning",
        2000
      );
      return;
    }

    setSubmitting(true);

    try {
      const nameForSymbol = tokenNameValue || "Asset";
      const desiredStandard =
        state.tokenStandard || asset?.tokenStandard || "ERC-20";
      let tokenAddress = asset?.tokenAddress;

      if (!tokenAddress) {
        setToast("Deploying asset token...", "warning", 2000);
        const symbol = nameForSymbol
          ? nameForSymbol.replace(/\W+/g, "").toUpperCase().slice(0, 6) ||
            "ASSET"
          : "ASSET";

        if (!accessToken) {
          setToast("Login required to tokenize assets.", "danger", 2500);
          setSubmitting(false);
          return;
        }

        const response = await fetch("/api/tokenize-asset", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            assetId: effectiveAssetId,
            userId: activeUser.uid,
            name: nameForSymbol,
            symbol,
            tokenStandard: desiredStandard,
          }),
        });

        if (!response.ok) {
          let errorMessage = "Token deployment failed. Please try again.";
          try {
            const data = (await response.json()) as { error?: string };
            if (data?.error) {
              errorMessage = data.error;
            }
          } catch {
            // Ignore JSON parse failures and use fallback message.
          }
          setToast(errorMessage, "danger", 3000);
          setSubmitting(false);
          return;
        }

        const data = (await response.json()) as { address: string };
        tokenAddress = data.address;
      }

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
            tenantUserId: activeUser.uid,
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
    } catch {
      setToast("Failed to submit asset.", "danger", 2500);
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
    { label: "Token standard", value: displayTokenStandard.toUpperCase() },
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
