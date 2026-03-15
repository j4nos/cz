"use client";

import type { ReadPort } from "@/src/application/interfaces/readPort";
import { AmplifyInvestmentRepository } from "@/src/infrastructure/repositories/amplifyInvestmentRepository";

export class AmplifyReadController implements ReadPort {
  constructor(private readonly repository: AmplifyInvestmentRepository = new AmplifyInvestmentRepository()) {}

  async listAssets() {
    return this.repository.listAssets();
  }

  async getAssetById(assetId: string) {
    return this.repository.getAssetById(assetId);
  }

  async getListingById(listingId: string) {
    return this.repository.getListingById(listingId);
  }

  async getOrderById(orderId: string) {
    return this.repository.getOrderById(orderId);
  }

  async listListingsByAssetId(assetId: string) {
    const listings = await this.repository.listListings();
    return listings.filter((listing) => listing.assetId === assetId);
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
