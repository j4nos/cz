import { describe, expect, it, vi } from "vitest";

import { RequestOwnershipMintingService } from "@/src/application/use-cases/requestOwnershipMintingService";
import { makeAsset, makeListing, makeMintRequest, makeOrder } from "@/tests/helpers/factories";

describe("RequestOwnershipMintingService", () => {
  it("returns 404 when the order is missing", async () => {
    const service = new RequestOwnershipMintingService(
      {
        getOrderById: vi.fn().mockResolvedValue(null),
        getListingById: vi.fn(),
        getAssetById: vi.fn(),
        getMintRequestById: vi.fn(),
        createMintRequestIfMissing: vi.fn(),
      },
      { process: vi.fn() },
      vi.fn().mockReturnValue(true),
    );

    await expect(service.requestMint({ orderId: "order-1", userId: "investor-1" })).resolves.toEqual({
      status: 404,
      body: { error: "Order not found." },
    });
  });

  it("returns 202 for an existing queued request", async () => {
    const service = new RequestOwnershipMintingService(
      {
        getOrderById: vi.fn().mockResolvedValue(makeOrder({ status: "paid", investorWalletAddress: "0xwallet" })),
        getListingById: vi.fn(),
        getAssetById: vi.fn(),
        getMintRequestById: vi.fn().mockResolvedValue(makeMintRequest({ mintStatus: "queued" })),
        createMintRequestIfMissing: vi.fn(),
      },
      { process: vi.fn() },
      vi.fn().mockReturnValue(true),
    );

    const result = await service.requestMint({ orderId: "order-1", userId: "investor-1" });
    expect(result).toEqual({
      status: 202,
      body: { status: "pending", mintRequestedAt: "2026-03-16T08:00:00.000Z" },
    });
  });

  it("returns 200 for an existing minted request", async () => {
    const service = new RequestOwnershipMintingService(
      {
        getOrderById: vi.fn().mockResolvedValue(makeOrder({ status: "paid", investorWalletAddress: "0xwallet" })),
        getListingById: vi.fn(),
        getAssetById: vi.fn(),
        getMintRequestById: vi.fn().mockResolvedValue(makeMintRequest({ mintStatus: "minted", blockchainTxHash: "0xtx", updatedAt: "2026-03-16T09:00:00.000Z" })),
        createMintRequestIfMissing: vi.fn(),
      },
      { process: vi.fn() },
      vi.fn().mockReturnValue(true),
    );

    const result = await service.requestMint({ orderId: "order-1", userId: "investor-1" });
    expect(result).toEqual({
      status: 200,
      body: {
        status: "minted",
        mintRequestedAt: "2026-03-16T08:00:00.000Z",
        mintedAt: "2026-03-16T09:00:00.000Z",
        txHash: "0xtx",
      },
    });
  });

  it("creates a request and delegates to the processor", async () => {
    const process = vi.fn().mockResolvedValue({
      status: "minted",
      mintRequestedAt: "2026-03-16T08:00:00.000Z",
      mintedAt: "2026-03-16T09:00:00.000Z",
      txHash: "0xtx",
    });
    const service = new RequestOwnershipMintingService(
      {
        getOrderById: vi.fn().mockResolvedValue(makeOrder({ status: "paid" })),
        getListingById: vi.fn().mockResolvedValue(makeListing()),
        getAssetById: vi.fn().mockResolvedValue(makeAsset({ tokenAddress: "0xtoken" })),
        getMintRequestById: vi.fn().mockResolvedValue(null),
        createMintRequestIfMissing: vi.fn().mockResolvedValue({
          created: true,
          request: makeMintRequest(),
        }),
      },
      { process },
      vi.fn().mockReturnValue(true),
    );

    const result = await service.requestMint({
      orderId: "order-1",
      userId: "investor-1",
      walletAddress: "0xwallet",
    });

    expect(process).toHaveBeenCalled();
    expect(result).toEqual({
      status: 200,
      body: {
        status: "minted",
        mintRequestedAt: "2026-03-16T08:00:00.000Z",
        mintedAt: "2026-03-16T09:00:00.000Z",
        txHash: "0xtx",
      },
    });
  });
});
