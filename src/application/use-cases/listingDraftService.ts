import type { InvestmentRepository } from "@/src/domain/repositories/investmentRepository";
import { InvestmentPlatformService } from "@/src/application/use-cases/investmentPlatformService";
import type { Listing } from "@/src/domain/entities";

type ListingDraftRepository = Pick<
  InvestmentRepository,
  "updateListing" | "getListingById" | "createListing" | "deleteListing" | "deleteProduct"
>;

export class ListingDraftService {
  constructor(
    private readonly repository: ListingDraftRepository,
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
    return this.service.createListing({
      ...input,
      saleStatus: "closed",
    });
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
