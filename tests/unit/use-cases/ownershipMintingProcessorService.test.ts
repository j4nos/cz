import { describe, expect, it, vi } from "vitest";

import type { RequestClaimPort } from "@/src/application/interfaces/requestClaimPort";
import { OwnershipMintingProcessorService } from "@/src/application/use-cases/ownershipMintingProcessorService";
import { makeAsset, makeListing, makeMintRequest, makeOrder } from "@/tests/helpers/factories";

class FakeRepository {
  currentRequest = makeMintRequest();
  updatedOrder = makeOrder();
  updatedRequests = [] as ReturnType<typeof makeMintRequest>[];

  async getMintRequestById() {
    return this.currentRequest;
  }

  async updateOrder(order: ReturnType<typeof makeOrder>) {
    this.updatedOrder = order;
    return order;
  }

  async updateMintRequest(request: ReturnType<typeof makeMintRequest>) {
    this.currentRequest = request;
    this.updatedRequests.push(request);
    return request;
  }
}

function makeClaimPort(claimed = true): RequestClaimPort {
  return {
    claimContractDeploymentRequest: vi.fn(),
    claimMintRequest: vi.fn().mockResolvedValue(claimed),
  };
}

describe("OwnershipMintingProcessorService", () => {
  it("returns minted immediately for an already minted request", async () => {
    const repository = new FakeRepository();
    const service = new OwnershipMintingProcessorService(
      repository,
      { mint: vi.fn() },
      makeClaimPort(),
    );

    const result = await service.process({
      request: makeMintRequest({ mintStatus: "minted", blockchainTxHash: "0xtx", updatedAt: "2026-03-16T09:00:00.000Z" }),
      order: makeOrder({ mintRequestedAt: "2026-03-16T08:00:00.000Z", mintedAt: "2026-03-16T09:00:00.000Z", mintTxHash: "0xtx" }),
      listing: makeListing(),
      asset: makeAsset({ tokenAddress: "0xtoken" }),
      walletAddress: "0xwallet",
    });

    expect(result).toEqual({
      status: "minted",
      mintRequestedAt: "2026-03-16T08:00:00.000Z",
      mintedAt: "2026-03-16T09:00:00.000Z",
      txHash: "0xtx",
    });
  });

  it("returns pending for a submitted request", async () => {
    const repository = new FakeRepository();
    const service = new OwnershipMintingProcessorService(
      repository,
      { mint: vi.fn() },
      makeClaimPort(),
    );

    const result = await service.process({
      request: makeMintRequest({ mintStatus: "submitted" }),
      order: makeOrder(),
      listing: makeListing(),
      asset: makeAsset({ tokenAddress: "0xtoken" }),
      walletAddress: "0xwallet",
    });

    expect(result.status).toBe("pending");
  });

  it("returns an idempotent minted result when another worker already finished the request", async () => {
    const repository = new FakeRepository();
    repository.currentRequest = makeMintRequest({ mintStatus: "minted", blockchainTxHash: "0xdone" });
    const service = new OwnershipMintingProcessorService(
      repository,
      { mint: vi.fn() },
      makeClaimPort(false),
    );

    const result = await service.process({
      request: makeMintRequest(),
      order: makeOrder(),
      listing: makeListing(),
      asset: makeAsset({ tokenAddress: "0xtoken" }),
      walletAddress: "0xwallet",
    });

    expect(result).toEqual({
      status: "minted",
      mintRequestedAt: repository.currentRequest.createdAt,
      mintedAt: repository.currentRequest.updatedAt,
      txHash: "0xdone",
    });
  });

  it("updates the request and order when minting succeeds", async () => {
    const repository = new FakeRepository();
    const service = new OwnershipMintingProcessorService(
      repository,
      { mint: vi.fn().mockResolvedValue({ txHash: "0xtxhash", tokenId: "7" }) },
      makeClaimPort(),
    );

    const result = await service.process({
      request: makeMintRequest(),
      order: makeOrder({ status: "paid" }),
      listing: makeListing(),
      asset: makeAsset({ tokenAddress: "0xtoken", tokenStandard: "ERC-721" }),
      walletAddress: "0xwallet",
    });

    expect(result.status).toBe("minted");
    expect(repository.updatedRequests).toHaveLength(2);
    expect(repository.updatedRequests[0]).toMatchObject({ mintStatus: "submitted", blockchainTxHash: "0xtxhash" });
    expect(repository.updatedRequests[1]).toMatchObject({ mintStatus: "minted", tokenId: "7" });
    expect(repository.updatedOrder).toMatchObject({
      investorWalletAddress: "0xwallet",
      mintTxHash: "0xtxhash",
    });
    expect(repository.updatedOrder.withdrawnAt).toBeUndefined();
  });

  it("increments retry count and stores the error when minting fails", async () => {
    const repository = new FakeRepository();
    repository.currentRequest = makeMintRequest({ retryCount: 2 });
    const service = new OwnershipMintingProcessorService(
      repository,
      { mint: vi.fn().mockRejectedValue(new Error("mint failed")) },
      makeClaimPort(),
    );

    await expect(
      service.process({
        request: makeMintRequest({ retryCount: 2 }),
        order: makeOrder({ status: "paid" }),
        listing: makeListing(),
        asset: makeAsset({ tokenAddress: "0xtoken" }),
        walletAddress: "0xwallet",
      }),
    ).rejects.toThrow("mint failed");

    expect(repository.updatedRequests.at(-1)).toMatchObject({
      mintStatus: "failed",
      retryCount: 3,
      errorMessage: "mint failed",
    });
    expect(repository.updatedOrder).toMatchObject({
      investorWalletAddress: "0xwallet",
      mintError: "mint failed",
      mintingAt: undefined,
    });
  });
});