"use client";

import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Form, FormField, FormInput, FormSelect } from "@/components/ui/Form";
import { usePrivateAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { useAssetWizard } from "@/contexts/asset-wizard-context";
import { createSaveAssetDraftService } from "@/src/presentation/composition/client";

export default function AssetWizardStep1Page() {
  return (
    <Suspense fallback={null}>
      <Step1Content />
    </Suspense>
  );
}

function Step1Content() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = usePrivateAuth();
  const { setToast } = useToast();
  const { state, updateState, resetState } = useAssetWizard();
  const saveAssetDraftService = createSaveAssetDraftService();

  useEffect(() => {
    if (searchParams.get("fresh") !== "1") {
      return;
    }

    resetState();
    router.replace("/asset-provider/assets/new/step-1");
  }, [resetState, router, searchParams]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      const result = await saveAssetDraftService.save({
        assetId: state.assetId || crypto.randomUUID(),
        userId: user.uid,
        name: state.name,
        country: state.country || "France",
        assetClass: state.assetClass,
        tokenStandard: state.tokenStandard,
      });

      if (result.kind === "error") {
        throw new Error(result.message);
      }
      const savedAsset = result.asset;

      updateState({ assetId: savedAsset.id });
      router.push(`/asset-provider/assets/new/${savedAsset.id}/step-2`);
    } catch (error) {
      console.error("[asset-step-1] save failed", error);
      setToast(
        error instanceof Error ? error.message : "Failed to save asset basics.",
        "danger",
        2500,
      );
    }
  }

  return (
    <>
      <h1>Step 1 - Asset basics</h1>
      <Form onSubmit={handleSubmit}>
        <FormField label="Name" htmlFor="asset-name">
          <FormInput
            id="asset-name"
            value={state.name}
            onChange={(event) => updateState({ name: event.target.value })}
            placeholder="ASSET NAME"
            required
          />
        </FormField>
        <FormField label="Country" htmlFor="asset-country">
          <FormInput
            id="asset-country"
            value={state.country}
            onChange={(event) => updateState({ country: event.target.value })}
          />
        </FormField>
        <FormField label="Asset class" htmlFor="asset-class">
          <FormSelect
            id="asset-class"
            value={state.assetClass}
            onChange={(event) => updateState({ assetClass: event.target.value })}
            options={[
              { value: "Office", label: "Office" },
              { value: "Logistics", label: "Logistics" },
              { value: "Retail", label: "Retail" },
              { value: "Industrial", label: "Industrial" },
              { value: "Mixed-Use", label: "Mixed-Use" },
              { value: "Infrastructure", label: "Infrastructure" },
            ]}
          />
        </FormField>
        <FormField label="Token standard" htmlFor="asset-token-standard">
          <FormSelect
            id="asset-token-standard"
            value={state.tokenStandard}
            onChange={(event) =>
              updateState({
                tokenStandard: event.target.value as "ERC-20" | "ERC-721",
              })
            }
            options={[
              { value: "ERC-20", label: "ERC-20" },
              { value: "ERC-721", label: "ERC-721" },
            ]}
          />
        </FormField>
        <Button type="submit">Save and continue</Button>
      </Form>
    </>
  );
}
