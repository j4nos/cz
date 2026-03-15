"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { Form, FormField, FormInput, FormSelect } from "@/components/ui/Form";
import { useAssetWizard } from "@/contexts/asset-wizard-context";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/contexts/AuthContext";

export default function AssetWizardStep3Page() {
  return (
    <Suspense fallback={null}>
      <Step3Content />
    </Suspense>
  );
}

function Step3Content() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const searchAssetId = searchParams.get("assetId") ?? "";
  const { state, updateState } = useAssetWizard();
  const assetId = searchAssetId || state.assetId || "";
  const { activeUser } = useAuth();
  const [docType, setDocType] = useState("brochure");
  const [file, setFile] = useState<File | null>(null);
  const { setToast } = useToast();

  useEffect(() => {
    if (searchAssetId && searchAssetId !== state.assetId) {
      updateState({ assetId: searchAssetId });
    }
  }, [searchAssetId, state.assetId, updateState]);

  if (!assetId) {
    return (
      <p className="muted">Missing assetId. Complete previous steps first.</p>
    );
  }

  if (!activeUser) {
    return <p className="muted">Login to upload documents.</p>;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!assetId || !file) {
      setToast("Please choose a document", "warning", 2000);
      return;
    }

    setToast("Document uploaded", "success", 2000);
    setFile(null);
  }

  function handleSkip() {
    if (!assetId) {
      setToast(
        "Missing assetId. Complete previous steps first.",
        "danger",
        2000
      );
      return;
    }

    router.push(`/asset-provider/assets/new/step-4?assetId=${assetId}`);
  }

  return (
    <>
      <h1>Step 3 - Upload documents</h1>
      <Form onSubmit={handleSubmit}>
        <FormField label="Type" htmlFor="doc-type">
          <FormSelect
            id="doc-type"
            value={docType}
            options={[
              { value: "brochure", label: "Brochure" },
              { value: "financials", label: "Financials" },
              { value: "legal", label: "Legal" },
            ]}
            onChange={(event) => setDocType(event.target.value)}
          />
        </FormField>
        <FormField label="Document" htmlFor="doc-file">
          <FormInput
            id="doc-file"
            type="file"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
        </FormField>
        <div className="horizontal-stack">
          <Button type="submit">Upload document</Button>
          <Button type="button" variant="ghost" onClick={handleSkip}>
            Continue
          </Button>
        </div>
      </Form>
    </>
  );
}
