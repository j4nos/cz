"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Form, FormField, FormInput, FormSelect } from "@/components/ui/Form";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { useAssetWizard } from "@/contexts/asset-wizard-context";

export default function AssetWizardStep1Page() {
  const router = useRouter();
  const { activeUser, accessToken } = useAuth();
  const { setToast } = useToast();
  const { state, updateState } = useAssetWizard();

  if (!activeUser) {
    return <p className="muted">Login to create an asset.</p>;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      if (!accessToken) {
        setToast("Login required to save asset basics.", "danger", 2500);
        return;
      }

      const response = await fetch("/api/assets/draft", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          assetId: state.assetId,
          name: state.name,
          country: state.country || "France",
          assetClass: state.assetClass,
          tokenStandard: state.tokenStandard,
        }),
      });
      const result = (await response.json().catch(() => ({}))) as {
        asset?: { id: string };
        error?: string;
      };

      if (!response.ok || !result.asset) {
        throw new Error(result.error || "Failed to save asset basics.");
      }

      updateState({ assetId: result.asset.id });
      router.push("/asset-provider/assets/new/step-2");
    } catch (error) {
      console.error("[asset-step-1] save failed", error);
      setToast("Failed to save asset basics.", "danger", 2500);
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
              updateState({ tokenStandard: event.target.value })
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
