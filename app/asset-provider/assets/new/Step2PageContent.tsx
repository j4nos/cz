"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { Form, FormField, FormInput } from "@/components/ui/Form";
import { usePrivateAuth } from "@/contexts/AuthContext";
import { useAssetWizard } from "@/contexts/asset-wizard-context";
import { useToast } from "@/contexts/ToastContext";
import { appendAssetImages } from "@/src/presentation/composition/client";

export function Step2PageContent({ assetId }: { assetId: string }) {
  const router = useRouter();
  usePrivateAuth();
  const { state, updateState } = useAssetWizard();
  const { setToast } = useToast();
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (assetId !== state.assetId) {
      updateState({ assetId });
    }
  }, [assetId, state.assetId, updateState]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!files.length) {
      setToast("Please select file(s)", "warning", 2000);
      return;
    }

    setUploading(true);
    try {
      const uploadedPaths = await appendAssetImages({ assetId, files });
      setFiles([]);
      setToast(`Uploaded ${uploadedPaths.length} file(s)`, "success", 2000);
    } finally {
      setUploading(false);
    }
  }

  function handleSkip() {
    router.push(`/asset-provider/assets/new/${assetId}/step-3`);
  }

  return (
    <>
      <h1>Step 2 - Upload media</h1>
      <Form onSubmit={handleSubmit}>
        <FormField label="" htmlFor="asset-photo">
          <FormInput
            id="asset-photo"
            type="file"
            accept="image/*"
            multiple
            onChange={(event) =>
              setFiles(event.target.files ? Array.from(event.target.files) : [])
            }
          />
        </FormField>
        <div className="horizontal-stack">
          <Button type="submit" disabled={uploading}>
            {uploading ? "Uploading..." : "Upload photo"}
          </Button>
          <Button type="button" variant="ghost" onClick={handleSkip}>
            Continue
          </Button>
        </div>
      </Form>
    </>
  );
}
