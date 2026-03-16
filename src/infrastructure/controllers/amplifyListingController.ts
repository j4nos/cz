"use client";

import type { ListingPort } from "@/src/application/interfaces/listingPort";
import { InvestmentPlatformService } from "@/src/application/use-cases/investmentPlatformService";
import type { Listing } from "@/src/domain/entities";

type ListingRepository = {
  updateListing(listing: Listing): Promise<Listing>;
  getListingById(listingId: string): Promise<Listing | null>;
  createListing(listing: Listing): Promise<Listing>;
  deleteListing(listingId: string): Promise<void>;
  deleteProduct(productId: string): Promise<void>;
};

export class AmplifyListingController implements ListingPort {
  constructor(
    private readonly repository: ListingRepository,
    private readonly service: Pick<InvestmentPlatformService, "createListing">,
  ) {}

  async createListingDraft(input: {
    assetId: string;
    title: string;
    eligibility: string;
    currency: string;
    fromPrice: number;
    description: string;
    startsAt?: string;
    endsAt?: string;
  }): Promise<Listing> {
    const listing = await this.service.createListing(input);
    const draft: Listing = { ...listing, saleStatus: "closed" };
    const saved = await this.repository.updateListing(draft);
    return saved;
  }

  async saveListingDraft(listing: Listing): Promise<Listing> {
    const existing = await this.repository.getListingById(listing.id);
    if (existing) {
      return this.repository.updateListing(listing);
    }

    return this.repository.createListing(listing);
  }

  async deleteListing(listingId: string): Promise<void> {
    await this.repository.deleteListing(listingId);
  }

  async removeProduct(productId: string): Promise<void> {
    await this.repository.deleteProduct(productId);
  }
}
