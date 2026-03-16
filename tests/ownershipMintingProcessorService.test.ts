import { describe, expect, it } from "vitest";

import { OwnershipMintingProcessorService } from "@/src/application/use-cases/ownershipMintingProcessorService";
import type { Asset, Listing, MintRequest, Order } from "@/src/domain/entities";
import type { RequestClaimPort } from "@/src/application/interfaces/requestClaimPort";

class FakeRepository {
  currentRequest: MintRequest | null = null;
  updatedOrder: Order | null = null;
  updatedRequests: MintRequest[] = [];

  async getMintRequestById(): Promise<MintRequest | null> {
    return this.updatedRequests.at(-1) ?? this.currentRequest;
  }

  async updateOrder(order: Order): Promise<Order> {
    this.updatedOrder = order;
    return order;
  }

  async updateMintRequest(request: MintRequest): Promise<MintRequest> {
    this.updatedRequests.push(request);
    return request;
  }
}

class FakeGateway {
  async mint() {
    return { txHash: "0xtxhash" };
  }
}

class FakeClaimPort implements RequestClaimPort {
  async claimContractDeploymentRequest(): Promise<boolean> {
    return true;
  }

  async claimMintRequest(): Promise<boolean> {
    return true;
  }
}

describe("OwnershipMintingProcessorService", () => {
  it("does not mark the order as withdrawn when minting completes", async () => {
    const repository = new FakeRepository();
    const service = new OwnershipMintingProcessorService(
      repository,
      new FakeGateway(),
      new FakeClaimPort(),
    );

    const request: MintRequest = {
      id: "mint:order-1",
      orderId: "order-1",
      assetId: "asset-1",
      idempotencyKey: "mint:order-1",
      mintStatus: "queued",
      retryCount: 0,
      createdAt: "2026-03-16T08:00:00.000Z",
      updatedAt: "2026-03-16T08:00:00.000Z",
    };
    repository.currentRequest = request;
    const order: Order = {
      id: "order-1",
      investorId: "investor-1",
      providerUserId: "provider-1",
      listingId: "listing-1",
      productId: "product-1",
      quantity: 2,
      unitPrice: 100,
      total: 200,
      status: "paid",
      currency: "EUR",
    };
    const listing: Listing = {
      id: "listing-1",
      assetId: "asset-1",
      title: "Title",
      description: "Description",
      assetClass: "REAL_ESTATE",
      eligibility: "ANY",
      currency: "EUR",
      fromPrice: 100,
      saleStatus: "open",
    };
    const asset: Asset = {
      id: "asset-1",
      tenantUserId: "provider-1",
      name: "Asset",
      country: "HU",
      assetClass: "REAL_ESTATE",
      status: "approved",
      missingDocsCount: 0,
      imageUrls: [],
      tokenAddress: "0xtoken",
      tokenStandard: "ERC-20",
    };

    await service.process({
      request,
      order,
      listing,
      asset,
      walletAddress: "0xwallet",
    });

    expect(repository.updatedOrder?.mintedAt).toBeTruthy();
    expect(repository.updatedOrder?.withdrawnAt).toBeUndefined();
  });
});
