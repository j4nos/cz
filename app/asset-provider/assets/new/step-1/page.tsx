"use client";

import Link from "next/link";

import { useAssetWizard } from "@/contexts/asset-wizard-context";

export default function AssetWizardStep1Page() {
  const { state, updateState } = useAssetWizard();

  return (
    <section>
      <h1>New asset: step 1</h1>
      <form>
        <label>
          Asset name
          <input
            onChange={(event) => updateState({ name: event.target.value })}
            type="text"
            value={state.name}
          />
        </label>
        <label>
          Country
          <input
            onChange={(event) => updateState({ country: event.target.value })}
            type="text"
            value={state.country}
          />
        </label>
        <label>
          Asset class
          <input
            onChange={(event) => updateState({ assetClass: event.target.value })}
            type="text"
            value={state.assetClass}
          />
        </label>
        <label>
          Token standard
          <input
            onChange={(event) => updateState({ tokenStandard: event.target.value })}
            type="text"
            value={state.tokenStandard}
          />
        </label>
      </form>
      <Link href="/asset-provider/assets/new/step-2">Continue</Link>
    </section>
  );
}
