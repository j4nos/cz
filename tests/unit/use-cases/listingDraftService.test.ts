import { describe, expect, it } from "vitest";

import { ListingDraftService } from "@/src/application/use-cases/listingDraftService";
import { makeListing } from "@/tests/helpers/factories";

class FakeRepository {
  existingListing: ReturnType<typeof makeListing> | null = null;
  createdListing: ReturnType<typeof makeListing> | null = null;
  updatedListing: ReturnType<typeof makeListing> | null = null;
  deletedListingId: string | null = null;
  deletedProductId: string | null = null;

  async createListing(input: ReturnType<typeof makeListing>) {
    this.createdListing = input;
    return input;
  }

  async getListingById(id: string) {
    return this.existingListing?.id === id ? this.existingListing : null;
  }

  async updateListing(input: ReturnType<typeof makeListing>) {
    this.updatedListing = input;
    return input;
  }

  async deleteListing(listingId: string) {
    this.deletedListingId = listingId;
  }

  async deleteProduct(productId: string) {
    this.deletedProductId = productId;
  }
}

describe("ListingDraftService", () => {
  it("creates draft listings as closed in a single create step", async () => {
    const repository = new FakeRepository();
    const createListing = async (input: Parameters<import("@/src/application/use-cases/investmentPlatformService").InvestmentPlatformService["createListing"]>[0]) =>
      makeListing({
        id: "listing-generated",
        assetId: input.assetId,
        title: input.title,
        description: input.description,
        eligibility: input.eligibility,
        currency: input.currency,
        fromPrice: input.fromPrice,
        saleStatus: input.saleStatus,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
      });

    const service = new ListingDraftService(repository, { createListing });

    const listing = await service.createListingDraft({
      assetId: "asset-1",
      title: "Draft listing",
      description: "Description",
      eligibility: "ANY",
      currency: "EUR",
      fromPrice: 1000,
      startsAt: "2026-03-20",
      endsAt: "2026-03-30",
    });

    expect(listing.saleStatus).toBe("closed");
    expect(repository.updatedListing).toBeNull();
  });

  it("updates existing drafts instead of creating duplicates", async () => {
    const repository = new FakeRepository();
    repository.existingListing = makeListing({ id: "listing-1", saleStatus: "closed" });
    const service = new ListingDraftService(repository, {
      createListing: async () => makeListing(),
    });

    const next = makeListing({ id: "listing-1", title: "Updated draft", saleStatus: "closed" });
    const saved = await service.saveListingDraft(next);

    expect(saved.title).toBe("Updated draft");
    expect(repository.updatedListing).toEqual(next);
    expect(repository.createdListing).toBeNull();
  });
});
