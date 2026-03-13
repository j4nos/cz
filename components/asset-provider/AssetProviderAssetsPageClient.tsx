"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { getController, type AssetRecord } from "@/src/application/controller";

export function AssetProviderAssetsPageClient({ createdAssetId }: { createdAssetId?: string }) {
  const [assetList, setAssetList] = useState<AssetRecord[]>([]);

  useEffect(() => {
    setAssetList(getController().queries.listAssets());
  }, []);

  return (
    <section>
      <h1>Assets</h1>
      {createdAssetId ? <p>Created asset: {createdAssetId}</p> : null}
      <p>
        <Link href="/asset-provider/assets/new/step-1">Create new asset</Link>
      </p>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Country</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {assetList.map((asset) => (
            <tr key={asset.id}>
              <td>{asset.name}</td>
              <td>{asset.country}</td>
              <td>
                <Link href={`/asset-provider/assets/${asset.id}`}>Open asset</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
