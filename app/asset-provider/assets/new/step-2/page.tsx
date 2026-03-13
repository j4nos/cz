"use client";

import { generateClient } from "aws-amplify/data";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type { Schema } from "@/amplify/data/resource";
import { Button } from "@/components/ui/Button";
import { Form, FormField, FormInput } from "@/components/ui/Form";
import { useAssetWizard } from "@/contexts/asset-wizard-context";
import { useToast } from "@/contexts/ToastContext";
import { uploadData } from "aws-amplify/storage";
import { ensureAmplifyConfigured } from "@/src/infrastructure/amplify/config";
import {
  assetImagePrefix,
  normalizeStoredPublicPath,
  toPublicStorageUrl,
  toSafeFileName,
} from "@/src/infrastructure/storage/publicUrls";

export default function AssetWizardStep2Page() {
  const router = useRouter();
  const { state, updateState } = useAssetWizard();
  const { setToast } = useToast();
  const [files, setFiles] = useState<File[]>([]);

  if (!state.assetId) {
    return <p className="muted">Missing assetId. Complete Step 1 first.</p>;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!files.length) {
      setToast("Please select file(s).", "warning", 2000);
      return;
    }

    const uploadedPaths = await Promise.all(
      files.map(async (file, index) => {
        const fileName = `${Date.now()}-${index}-${toSafeFileName(file.name)}`;
        const path = `${assetImagePrefix(state.assetId)}${fileName}`;
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
    const existingAsset = await client.models.Asset.get({ id: state.assetId });
    const existingImages = Array.isArray(existingAsset.data?.imageUrls)
      ? existingAsset.data.imageUrls.filter((value): value is string => typeof value === "string")
      : [];
    const nextImages = Array.from(
      new Set([...existingImages.map(normalizeStoredPublicPath), ...uploadedPaths]),
    );
    await client.models.Asset.update({
      id: state.assetId,
      imageUrls: nextImages,
    });

    updateState({
      photos: [...state.photos, ...uploadedPaths.map(toPublicStorageUrl)],
    });
    setFiles([]);
    setToast(`Uploaded ${uploadedPaths.length} file(s).`, "success", 2000);
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
          <Button type="submit">Upload photo</Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push("/asset-provider/assets/new/step-3")}
          >
            Continue
          </Button>
        </div>
      </Form>
      <ul>
        {state.photos.map((photo) => (
          <li key={photo}>{photo}</li>
        ))}
      </ul>
    </>
  );
}
