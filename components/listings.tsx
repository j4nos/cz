"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { getController, type ListingWithAssetView } from "@/src/application/controller";

export function Listings({ basePath = "/listings" }: { basePath?: string }) {
  const [openListings, setOpenListings] = useState<ListingWithAssetView[]>([]);

  useEffect(() => {
    setOpenListings(getController().queries.listOpenListings());
  }, []);

  return (
    <section>
      <h1>Listings</h1>
      {openListings.map((listing) => (
        <article key={listing.listing.id}>
          {listing.asset?.imageUrls?.[0] ? (
            <img alt={listing.asset.name} height={100} src={listing.asset.imageUrls[0]} width={100} />
          ) : (
            <div>No image</div>
          )}
          <h2>{listing.asset?.name ?? "Unknown asset"}</h2>
          <p>From price: {listing.listing.fromPrice} {listing.listing.currency}</p>
          <Link href={`${basePath}/${listing.listing.id}`}>Details</Link>
        </article>
      ))}
    </section>
  );
}
