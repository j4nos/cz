import type { Listing } from "@/src/domain/entities";

export interface ListingPort {
  createListingDraft: (input: {
    assetId: string;
    title: string;
    eligibility: string;
    currency: string;
    fromPrice: number;
    description: string;
    startsAt?: string;
    endsAt?: string;
  }) => Promise<Listing>;
  saveListingDraft: (listing: Listing) => Promise<Listing>;
  deleteListing: (listingId: string) => Promise<void>;
  removeProduct: (productId: string) => Promise<void>;
}
