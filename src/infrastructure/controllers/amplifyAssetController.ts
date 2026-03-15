"use client";

import type { AssetPort } from "@/src/application/interfaces/assetPort";
import { InvestmentPlatformService } from "@/src/application/use-cases/investmentPlatformService";
import type { Asset } from "@/src/domain/entities";
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

export class AmplifyAssetController implements AssetPort {
  private readonly repository = new AmplifyInvestmentRepository();
  private readonly service = new InvestmentPlatformService(this.repository, new AmplifyIdGenerator(), new AmplifyClock());

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
