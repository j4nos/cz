"use client";

import Link from "next/link";
import { useState } from "react";

import { useAssetWizard } from "@/contexts/asset-wizard-context";

export default function AssetWizardStep3Page() {
  const { state, updateState } = useAssetWizard();
  const [documentName, setDocumentName] = useState("");

  return (
    <section>
      <h1>New asset: step 3</h1>
      <label>
        Documents
        <input
          onChange={(event) => setDocumentName(event.target.value.split("\\").pop() ?? "")}
          type="file"
        />
      </label>
      <button
        onClick={() =>
          documentName ? updateState({ documents: [...state.documents, documentName] }) : undefined
        }
        type="button"
      >
        Add document metadata
      </button>
      <ul>
        {state.documents.map((document) => (
          <li key={document}>{document}</li>
        ))}
      </ul>
      <p>Document upload is optional in the minimal flow.</p>
      <Link href="/asset-provider/assets/new/step-4">Continue</Link>
    </section>
  );
}
