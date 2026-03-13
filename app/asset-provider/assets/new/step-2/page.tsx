"use client";

import Link from "next/link";
import { useState } from "react";

import { useAssetWizard } from "@/contexts/asset-wizard-context";

export default function AssetWizardStep2Page() {
  const { state, updateState } = useAssetWizard();
  const [photoName, setPhotoName] = useState("");

  return (
    <section>
      <h1>New asset: step 2</h1>
      <label>
        Photos
        <input
          onChange={(event) => setPhotoName(event.target.value.split("\\").pop() ?? "")}
          type="file"
        />
      </label>
      <button
        onClick={() =>
          photoName ? updateState({ photos: [...state.photos, photoName] }) : undefined
        }
        type="button"
      >
        Add photo metadata
      </button>
      <ul>
        {state.photos.map((photo) => (
          <li key={photo}>{photo}</li>
        ))}
      </ul>
      <p>Photo upload is optional in the minimal flow.</p>
      <Link href="/asset-provider/assets/new/step-3">Continue</Link>
    </section>
  );
}
