"use client";

import type { AssetPort } from "@/src/application/interfaces/assetPort";
import { InvestmentPlatformService } from "@/src/application/use-cases/investmentPlatformService";
import type { Asset } from "@/src/domain/entities";

type AssetRepository = {
  getUserProfileById(userId: string): Promise<Awaited<ReturnType<InvestmentPlatformService["registerUserProfile"]>> | null>;
  createUserProfile(input: {
    id: string;
    email: string;
    role: "ASSET_PROVIDER";
    country: string;
    companyName: string;
    kycStatus: "approved";
    createdAt: string;
    updatedAt: string;
  }): Promise<unknown>;
  updateAsset(asset: Asset): Promise<Asset>;
  getAssetById(assetId: string): Promise<Asset | null>;
  listListings(): Promise<Array<{ id: string; assetId: string }>>;
  listProductsByListingId(listingId: string): Promise<Array<{ id: string }>>;
  deleteProduct(productId: string): Promise<void>;
  deleteListing(listingId: string): Promise<void>;
  deleteAsset(assetId: string): Promise<void>;
};

export class AmplifyAssetController implements AssetPort {
  constructor(
    private readonly repository: AssetRepository,
    private readonly service: Pick<InvestmentPlatformService, "createAsset">,
  ) {}

  async createAssetWithMedia(input: {
    tenantUserId: string;
    tenantEmail?: string;
    tenantCountry?: string;
    name: string;
    country: string;
    assetClass: string;
    tokenStandard?: string;
    imageUrls: string[];
    documents: { name: string }[];
  }): Promise<Asset | null> {
    const existingProfile = await this.repository.getUserProfileById(input.tenantUserId);
    if (!existingProfile) {
      const now = new Date().toISOString();
      await this.repository.createUserProfile({
        id: input.tenantUserId,
        email: input.tenantEmail ?? "",
        role: "ASSET_PROVIDER",
        country: input.tenantCountry ?? input.country ?? "HU",
        companyName: "Cityzeen Assets",
        kycStatus: "approved",
        createdAt: now,
        updatedAt: now,
      });
    }

    const asset = await this.service.createAsset(input);

    return this.repository.updateAsset({
      ...asset,
      imageUrls: input.imageUrls,
    });
  }

  async updateAsset(asset: Asset): Promise<Asset> {
    return this.repository.updateAsset(asset);
  }

  async deleteAsset(assetId: string): Promise<void> {
    const asset = await this.repository.getAssetById(assetId);
    if (!asset) {
      return;
    }

    const listings = (await this.repository.listListings()).filter(
      (listing) => listing.assetId === assetId,
    );

    for (const listing of listings) {
      const products = await this.repository.listProductsByListingId(listing.id);
      for (const product of products) {
        await this.repository.deleteProduct(product.id);
      }
      await this.repository.deleteListing(listing.id);
    }

    await this.repository.deleteAsset(assetId);
  }
}
