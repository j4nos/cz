"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { ListingDetails } from "@/components/listing";
import { getController, type ListingWithAssetView } from "@/src/application/controller";

export function ListingPageClient({ checkoutPath = "/checkout" }: { checkoutPath?: string }) {
  const params = useParams<{ listingId: string }>();
  const [listingWithAsset, setListingWithAsset] = useState<ListingWithAssetView | null | undefined>(undefined);

  useEffect(() => {
    setListingWithAsset(getController().queries.getListingWithAssetById(params.listingId));
  }, [params.listingId]);

  if (listingWithAsset === undefined) {
    return <p>Loading listing...</p>;
  }

  if (!listingWithAsset) {
    return (
      <section>
        <h1>Not found</h1>
        <p>Listing does not exist.</p>
      </section>
    );
  }

  return <ListingDetails checkoutPath={checkoutPath} listingWithAsset={listingWithAsset} />;
}
