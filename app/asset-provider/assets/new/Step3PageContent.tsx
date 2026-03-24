"use client";

import { generateClient } from "aws-amplify/data";
import { uploadData } from "aws-amplify/storage";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import type { Schema } from "@/amplify/data/resource";
import { Button } from "@/components/ui/Button";
import { Form, FormField, FormInput, FormSelect } from "@/components/ui/Form";
import { useAssetWizard } from "@/contexts/asset-wizard-context";
import { useToast } from "@/contexts/ToastContext";
import { usePrivateAuth } from "@/contexts/AuthContext";
import { ensureAmplifyConfigured } from "@/src/config/amplify";
import { assetDocPrefix, toSafeFileName } from "@/src/infrastructure/storage/publicUrls";

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

    const fileName = `${Date.now()}-${toSafeFileName(file.name)}`;
    const path = `${assetDocPrefix(assetId)}${fileName}`;
    await uploadData({
      path,
      data: file,
      options: {
        contentType: file.type || undefined,
      },
    }).result;

    ensureAmplifyConfigured();
    const client = generateClient<Schema>();
    await client.models.DocumentMeta.create({
      assetId,
      uploadedByUserId: user.uid,
      type: docType,
      name: file.name,
      status: "uploaded",
      createdAt: new Date().toISOString(),
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
