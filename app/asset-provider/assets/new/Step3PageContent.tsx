"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { Form, FormField, FormInput, FormSelect } from "@/components/ui/Form";
import { useAssetWizard } from "@/contexts/asset-wizard-context";
import { useToast } from "@/contexts/ToastContext";
import { usePrivateAuth } from "@/contexts/AuthContext";
import { uploadAssetDocument } from "@/src/presentation/composition/client";

export function Step3PageContent({ assetId }: { assetId: string }) {
  const router = useRouter();
  const { state, updateState } = useAssetWizard();
  const { user } = usePrivateAuth();
  const [docType, setDocType] = useState("brochure");
  const [file, setFile] = useState<File | null>(null);
  const { setToast } = useToast();

  useEffect(() => {
    if (assetId !== state.assetId) {
      updateState({ assetId });
    }
  }, [assetId, state.assetId, updateState]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!file) {
      setToast("Please choose a document", "warning", 2000);
      return;
    }

    await uploadAssetDocument({
      assetId,
      uploadedByUserId: user.uid,
      type: docType,
      file,
    });

    setToast("Document uploaded", "success", 2000);
    setFile(null);
  }

  function handleSkip() {
    router.push(`/asset-provider/assets/new/${assetId}/step-4`);
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
