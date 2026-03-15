"use client";

import { Listing } from "@/components/listing";
import type { PublicListingWithAsset } from "@/src/application/use-cases/publicContent";
import type { Product } from "@/src/domain/entities";

type Props = {
  listingId: string;
  initialListingWithAsset?: PublicListingWithAsset | null;
  initialProducts?: Product[];
};

export function InvestorListing({
  initialListingWithAsset,
  initialProducts,
}: Props) {
  return (
    <div className="vertical-stack-with-gap">
      <header>
        <h1>Investor Listings</h1>
        <p className="muted">Choose a product to invest in.</p>
      </header>
      <Listing
        initialListingWithAsset={initialListingWithAsset}
        initialProducts={initialProducts}
      />
    </div>
  );
}
