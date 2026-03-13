"use client";

import type { ListingController } from "@/src/application/listingController";
import { InvestmentPlatformService } from "@/src/application/useCases";
import type { Listing } from "@/src/domain/entities";
import { AmplifyInvestmentRepository } from "@/src/infrastructure/repositories/amplifyInvestmentRepository";

class AmplifyIdGenerator {
  next(): string {
    return `id-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
}

class AmplifyClock {
  now(): string {
    return new Date().toISOString();
  }
}

export class AmplifyListingController implements ListingController {
  private readonly repository = new AmplifyInvestmentRepository();
  private readonly service = new InvestmentPlatformService(this.repository, new AmplifyIdGenerator(), new AmplifyClock());

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
    console.log("[ASSET_LISTING_DEBUG] AmplifyListingController.createListingDraft:start", input);
    const listing = await this.service.createListing(input);
    const draft: Listing = { ...listing, saleStatus: "closed" };
    console.log("[ASSET_LISTING_DEBUG] AmplifyListingController.createListingDraft:serviceResult", {
      listingId: listing.id,
      assetId: listing.assetId,
      saleStatus: listing.saleStatus,
    });
    const saved = await this.repository.updateListing(draft);
    console.log("[ASSET_LISTING_DEBUG] AmplifyListingController.createListingDraft:repositoryResult", {
      listingId: saved.id,
      assetId: saved.assetId,
      saleStatus: saved.saleStatus,
    });
    return saved;
  }

  async saveListingDraft(listing: Listing): Promise<Listing> {
    console.log("[ASSET_LISTING_DEBUG] AmplifyListingController.saveListingDraft:start", {
      listingId: listing.id,
      assetId: listing.assetId,
      title: listing.title,
      saleStatus: listing.saleStatus,
    });
    const existing = await this.repository.getListingById(listing.id);
    console.log("[ASSET_LISTING_DEBUG] AmplifyListingController.saveListingDraft:existing", {
      listingId: listing.id,
      exists: Boolean(existing),
      existingAssetId: existing?.assetId ?? null,
    });
    if (existing) {
      const updated = await this.repository.updateListing(listing);
      console.log("[ASSET_LISTING_DEBUG] AmplifyListingController.saveListingDraft:updateResult", {
        listingId: updated.id,
        assetId: updated.assetId,
      });
      return updated;
    }

    const created = await this.repository.createListing(listing);
    console.log("[ASSET_LISTING_DEBUG] AmplifyListingController.saveListingDraft:createResult", {
      listingId: created.id,
      assetId: created.assetId,
    });
    return created;
  }

  async deleteListing(listingId: string): Promise<void> {
    await this.repository.deleteListing(listingId);
  }

  async removeProduct(productId: string): Promise<void> {
    await this.repository.deleteProduct(productId);
  }
}
