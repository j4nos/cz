"use client";

import type { ReadPort } from "@/src/application/interfaces/readPort";
import { stripProductCoupons } from "@/src/domain/policies/productCouponPolicy";

type ReadRepository = Pick<
  ReadPort,
  | "getAssetById"
  | "getListingById"
  | "getOrderById"
  | "listProductsByListingId"
  | "getProductById"
  | "listOrdersByInvestor"
  | "listOrdersByProvider"
> & {
  listAssets(): ReturnType<ReadPort["listAssets"]>;
  listListings(): Promise<Array<{ assetId: string } & Awaited<ReturnType<ReadPort["getListingById"]>> extends infer T ? T extends { id: string } ? T : never : never>>;
};

export class AmplifyReadController implements ReadPort {
  constructor(private readonly repository: ReadRepository) {}

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
    const products = await this.repository.listProductsByListingId(listingId);
    return products.map(stripProductCoupons);
  }

  async getProductById(productId: string) {
    const product = await this.repository.getProductById(productId);
    return product ? stripProductCoupons(product) : null;
  }

  async listOrdersByInvestor(investorId: string) {
    return this.repository.listOrdersByInvestor(investorId);
  }

  async listOrdersByProvider(providerUserId: string) {
    return this.repository.listOrdersByProvider(providerUserId);
  }
}
