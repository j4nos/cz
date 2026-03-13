"use client";

import type { ReadController } from "@/src/application/readController";
import { AmplifyInvestmentRepository } from "@/src/infrastructure/repositories/amplifyInvestmentRepository";

export class AmplifyReadController implements ReadController {
  constructor(private readonly repository: AmplifyInvestmentRepository = new AmplifyInvestmentRepository()) {}

  async listAssets() {
    return this.repository.listAssets();
  }

  async getAssetById(assetId: string) {
    const asset = await this.repository.getAssetById(assetId);
    console.log("[ASSET_LISTING_DEBUG] AmplifyReadController.getAssetById", {
      assetId,
      found: Boolean(asset),
    });
    return asset;
  }

  async getListingById(listingId: string) {
    const listing = await this.repository.getListingById(listingId);
    console.log("[ASSET_LISTING_DEBUG] AmplifyReadController.getListingById", {
      listingId,
      found: Boolean(listing),
      assetId: listing?.assetId ?? null,
    });
    return listing;
  }

  async getOrderById(orderId: string) {
    return this.repository.getOrderById(orderId);
  }

  async listListingsByAssetId(assetId: string) {
    const listings = await this.repository.listListings();
    const filtered = listings.filter((listing) => listing.assetId === assetId);
    console.log("[ASSET_LISTING_DEBUG] AmplifyReadController.listListingsByAssetId", {
      assetId,
      totalListings: listings.length,
      filteredListings: filtered.length,
      filteredIds: filtered.map((listing) => listing.id),
    });
    return filtered;
  }

  async listProductsByListingId(listingId: string) {
    return this.repository.listProductsByListingId(listingId);
  }

  async getProductById(productId: string) {
    return this.repository.getProductById(productId);
  }

  async listOrdersByInvestor(investorId: string) {
    return this.repository.listOrdersByInvestor(investorId);
  }

  async listOrdersByProvider(providerUserId: string) {
    return this.repository.listOrdersByProvider(providerUserId);
  }
}
