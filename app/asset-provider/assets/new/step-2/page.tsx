"use client";

import { generateClient } from "aws-amplify/data";
import { uploadData } from "aws-amplify/storage";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import type { Schema } from "@/amplify/data/resource";
import { Button } from "@/components/ui/Button";
import { Form, FormField, FormInput } from "@/components/ui/Form";
import { useAuth } from "@/contexts/AuthContext";
import { useAssetWizard } from "@/contexts/asset-wizard-context";
import { useToast } from "@/contexts/ToastContext";
import { ensureAmplifyConfigured } from "@/src/config/amplify";
import {
  assetImagePrefix,
  normalizeStoredPublicPath,
  toSafeFileName,
} from "@/src/infrastructure/storage/publicUrls";

export default function AssetWizardStep2Page() {
  return (
    <Suspense fallback={null}>
      <Step2Content />
    </Suspense>
  );
}

function Step2Content() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const searchAssetId = searchParams.get("assetId") ?? "";
  const { user } = useAuth();
  const { state, updateState } = useAssetWizard();
  const assetId = searchAssetId || state.assetId || "";
  const { setToast } = useToast();
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (searchAssetId && searchAssetId !== state.assetId) {
      updateState({ assetId: searchAssetId });
    }
  }, [searchAssetId, state.assetId, updateState]);

  if (!assetId) {
    return <p className="muted">Missing assetId. Complete Step 1 first.</p>;
  }

  if (!user) {
    return <p className="muted">Login to upload photos.</p>;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!assetId) {
      setToast("Missing assetId. Complete Step 1 first.", "danger", 2000);
      return;
    }

    if (!files.length) {
      setToast("Please select file(s)", "warning", 2000);
      return;
    }

    setUploading(true);
    try {
      const uploadedPaths = await Promise.all(
        files.map(async (file, index) => {
          const fileName = `${Date.now()}-${index}-${toSafeFileName(file.name)}`;
          const path = `${assetImagePrefix(assetId)}${fileName}`;
          await uploadData({
            path,
            data: file,
            options: {
              contentType: file.type || undefined,
            },
          }).result;
          return path;
        }),
      );

      ensureAmplifyConfigured();
      const client = generateClient<Schema>();
      const existingAsset = await client.models.Asset.get({ id: assetId });
      const existingImages = Array.isArray(existingAsset.data?.imageUrls)
        ? existingAsset.data.imageUrls.filter((value): value is string => typeof value === "string")
        : [];
      const nextImages = Array.from(
        new Set([...existingImages.map(normalizeStoredPublicPath), ...uploadedPaths]),
      );
      await client.models.Asset.update({
        id: assetId,
        imageUrls: nextImages,
      });

      setFiles([]);
      setToast(`Uploaded ${uploadedPaths.length} file(s)`, "success", 2000);
    } finally {
      setUploading(false);
    }
  }

  function handleSkip() {
    if (!assetId) {
      setToast("Missing assetId. Complete Step 1 first.", "danger", 2000);
      return;
    }
    router.push(`/asset-provider/assets/new/step-3?assetId=${assetId}`);
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
