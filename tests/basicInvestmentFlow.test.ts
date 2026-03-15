import { describe, expect, it } from "vitest";

import { InvestmentPlatformService } from "@/src/application/use-cases/investmentPlatformService";
import { DomainError } from "@/src/domain/value-objects/errors";
import { InMemoryInvestmentRepository } from "@/src/infrastructure/inMemoryInvestmentRepository";

class FixedIdGenerator {
  private current = 1;

  next(): string {
    const id = `id-${this.current}`;
    this.current += 1;
    return id;
  }
}

class FixedClock {
  now(): string {
    return "2026-03-13T10:00:00.000Z";
  }
}

function createService() {
  const repository = new InMemoryInvestmentRepository();
  const service = new InvestmentPlatformService(repository, new FixedIdGenerator(), new FixedClock());

  return { service, repository };
}

describe("InvestmentPlatformService", () => {
  it("completes the basic investment flow and decreases remaining supply", async () => {
    const { service, repository } = createService();

    const provider = await service.registerUserProfile({
      email: "provider@cityzeen.test",
      role: "ASSET_PROVIDER",
      country: "HU",
      companyName: "Cityzeen Assets",
    });

    const asset = await service.createAsset({
      tenantUserId: provider.id,
      name: "Budapest Office",
      country: "HU",
      assetClass: "REAL_ESTATE",
      tokenStandard: "ERC-3643",
    });

    expect(asset.imageUrls).toEqual([]);

    const listing = await service.createListing({
      assetId: asset.id,
      title: "Budapest Office Seed Listing",
      description: "Seed round for a Budapest office redevelopment.",
      eligibility: "PROFESSIONAL",
      currency: "EUR",
      fromPrice: 1000,
      startsAt: "2026-03-01",
      endsAt: "2026-03-31",
    });

    const product = await service.createProduct({
      listingId: listing.id,
      name: "Series A Token",
      currency: "EUR",
      unitPrice: 1000,
      minPurchase: 1,
      maxPurchase: 5,
      eligibleInvestorType: "PROFESSIONAL",
      supplyTotal: 50,
    });

    const investor = await service.registerUserProfile({
      email: "investor@cityzeen.test",
      role: "INVESTOR",
      country: "DE",
      investorType: "PROFESSIONAL",
    });

    const pendingOrder = await service.startOrder({
      investorId: investor.id,
      listingId: listing.id,
      productId: product.id,
      quantity: 3,
      investorWalletAddress: "0x123",
    });

    expect(pendingOrder.status).toBe("pending");
    expect(pendingOrder.total).toBe(3000);

    const completedOrder = await service.completeOrderPayment({ orderId: pendingOrder.id });

    expect(completedOrder.status).toBe("paid");

    const storedProduct = await repository.getProductById(product.id);
    expect(storedProduct?.remainingSupply).toBe(47);
  });
});
