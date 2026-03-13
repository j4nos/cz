"use client";

import { PlainCta } from "@/components/sections/PlainCta";

export default function AssetProviderPage() {
  return (
    <div className="vertical-stack-with-gap">
      <header>
        <h1>Asset Provider</h1>
        <p className="muted">Manage your assets and listings.</p>
      </header>
      <PlainCta
        title="Assets"
        text="Create and manage property assets."
        actionLabel="View assets"
        href="/asset-provider/assets"
      />
      <PlainCta
        title="Orders"
        text="Review investor orders assigned to you."
        actionLabel="View orders"
        href="/asset-provider/orders"
      />
    </div>
  );
}
