"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { getController, type AssetRecord } from "@/src/application/controller";

export default function AssetProviderAssetPage() {
  const params = useParams<{ assetId: string }>();
  const [asset, setAsset] = useState<AssetRecord | null | undefined>(undefined);

  useEffect(() => {
    setAsset(getController().queries.getAssetById(params.assetId));
  }, [params.assetId]);

  if (asset === undefined) {
    return <section><p>Loading asset...</p></section>;
  }

  if (!asset) {
    return (
      <section>
        <h1>Asset not found</h1>
        <p>The selected asset does not exist in the local demo store.</p>
        <p>
          <Link href="/asset-provider/assets">Back to assets</Link>
        </p>
      </section>
    );
  }

  const assetListings = getController().queries.listListingsByAssetId(asset.id);

  return (
    <section>
      <h1>{asset.name}</h1>
      <form>
        <label>
          Asset name
          <input defaultValue={asset.name} type="text" />
        </label>
      </form>
      <p>
        Contract: <a href={`https://example.com/address/${asset.tokenAddress}`}>{asset.tokenAddress}</a>
      </p>
      <p>
        <Link href={`/asset-provider/assets/${asset.id}/create`}>Add listing</Link>
      </p>
      <div>
        {asset.imageUrls.map((photo, index) => (
          <img key={`${asset.id}-${index}`} alt={`${asset.name} ${index + 1}`} src={photo} />
        ))}
      </div>
      <button type="button">Remove last photo</button>
      <table>
        <thead>
          <tr>
            <th>Document</th>
          </tr>
        </thead>
        <tbody>
          {asset.documents.length === 0 ? (
            <tr>
              <td>No documents uploaded.</td>
            </tr>
          ) : (
            asset.documents.map((document) => (
              <tr key={document.id}>
                <td>{document.name}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      <table>
        <thead>
          <tr>
            <th>Listing</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {assetListings.length === 0 ? (
            <tr>
              <td colSpan={2}>No listings yet.</td>
            </tr>
          ) : (
            assetListings.map((listing) => (
              <tr key={listing.id}>
                <td>{listing.title}</td>
                <td>
                  <Link href={`/asset-provider/assets/${asset.id}/listings/${listing.id}/edit`}>Details</Link>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      <button type="button">Delete asset</button>
    </section>
  );
}
