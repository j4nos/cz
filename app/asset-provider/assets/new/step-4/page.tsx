"use client";

import { useRouter } from "next/navigation";

import { useAssetWizard } from "@/contexts/asset-wizard-context";
import { getController } from "@/src/application/controller";

function createPlaceholderImage(label: string) {
  return (
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect width="100%" height="100%" fill="#ddd"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="32">${label}</text></svg>`,
    )
  );
}

export default function AssetWizardStep4Page() {
  const router = useRouter();
  const { state, resetState } = useAssetWizard();

  async function handleSubmit() {
    const asset = await getController().commands.createAssetWithMedia({
      tenantUserId: "provider-1",
      name: state.name || "Unnamed asset",
      country: state.country || "N/A",
      assetClass: state.assetClass || "REAL_ESTATE",
      tokenStandard: state.tokenStandard || "ERC-3643",
      imageUrls:
        state.photos.length > 0
          ? state.photos.map((photo) => createPlaceholderImage(photo))
          : [createPlaceholderImage(state.name || "New Asset")],
      documents: state.documents.map((document) => ({ name: document })),
    });

    resetState();
    router.push(`/asset-provider/assets?created=${asset?.id ?? ""}`);
  }

  return (
    <section>
      <h1>New asset: step 4</h1>
      <p>Review and submit.</p>
      <dl>
        <dt>Name</dt>
        <dd>{state.name || "-"}</dd>
        <dt>Country</dt>
        <dd>{state.country || "-"}</dd>
        <dt>Asset class</dt>
        <dd>{state.assetClass || "-"}</dd>
        <dt>Photos</dt>
        <dd>{state.photos.length}</dd>
        <dt>Documents</dt>
        <dd>{state.documents.length}</dd>
      </dl>
      <button disabled={!state.name} onClick={handleSubmit} type="button">
        Submit asset
      </button>
    </section>
  );
}
