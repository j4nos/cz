// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const { verifyAccessToken, isAddress, processMint, repository } = vi.hoisted(() => ({
  verifyAccessToken: vi.fn(),
  isAddress: vi.fn(),
  processMint: vi.fn(),
  repository: {
    getOrderById: vi.fn(),
    getMintRequestById: vi.fn(),
    getListingById: vi.fn(),
    getAssetById: vi.fn(),
    createMintRequestIfMissing: vi.fn(),
  },
}));

vi.mock("@/src/infrastructure/auth/verifyAccessToken", () => ({ verifyAccessToken }));
vi.mock("ethers", () => ({ ethers: { isAddress } }));
vi.mock("@/src/infrastructure/repositories/amplifyInvestmentRepository", () => ({
  AmplifyInvestmentRepository: class {
    getOrderById = repository.getOrderById;
    getMintRequestById = repository.getMintRequestById;
    getListingById = repository.getListingById;
    getAssetById = repository.getAssetById;
    createMintRequestIfMissing = repository.createMintRequestIfMissing;
  },
}));
vi.mock("@/src/application/use-cases/ownershipMintingProcessorService", () => ({
  OwnershipMintingProcessorService: class {
    process = processMint;
  },
}));
vi.mock("@/src/infrastructure/gateways/dynamoDbRequestClaimGateway", () => ({ DynamoDbRequestClaimGateway: class {} }));
vi.mock("@/src/infrastructure/gateways/ethersOwnershipMintingGateway", () => ({ EthersOwnershipMintingGateway: class {} }));

import { POST } from "@/app/api/mint-ownership/route";

const makeRequest = (body: Record<string, unknown>, withBearer = true) =>
  new Request("http://localhost/api/mint-ownership", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(withBearer ? { authorization: "Bearer token" } : {}),
    },
    body: JSON.stringify(body),
  });

describe("POST /api/mint-ownership", () => {
  beforeEach(() => {
    verifyAccessToken.mockReset().mockResolvedValue({ sub: "investor-1" });
    isAddress.mockReset().mockReturnValue(true);
    processMint.mockReset().mockResolvedValue({ status: "minted", mintRequestedAt: "2026-03-16T08:00:00.000Z", mintedAt: "2026-03-16T09:00:00.000Z", txHash: "0xtx" });
    repository.getOrderById.mockReset().mockResolvedValue({
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
    });
    repository.getMintRequestById.mockReset().mockResolvedValue(null);
    repository.getListingById.mockReset().mockResolvedValue({ id: "listing-1", assetId: "asset-1" });
    repository.getAssetById.mockReset().mockResolvedValue({ id: "asset-1", tokenAddress: "0xtoken", tokenStandard: "ERC-20" });
    repository.createMintRequestIfMissing.mockReset().mockResolvedValue({
      created: true,
      request: { id: "mint:order-1", orderId: "order-1", assetId: "asset-1", idempotencyKey: "mint:order-1", mintStatus: "queued", retryCount: 0, createdAt: "2026-03-16T08:00:00.000Z", updatedAt: "2026-03-16T08:00:00.000Z" },
    });
  });

  it("returns 401 when bearer token is missing", async () => {
    const response = await POST(makeRequest({ orderId: "order-1" }, false));
    expect(response.status).toBe(401);
  });

  it("returns 400 when orderId is missing", async () => {
    const response = await POST(makeRequest({}));
    expect(response.status).toBe(400);
  });

  it("returns 404 when the order is missing", async () => {
    repository.getOrderById.mockResolvedValue(null);
    const response = await POST(makeRequest({ orderId: "order-1" }));
    expect(response.status).toBe(404);
  });

  it("returns 409 when the order is not paid", async () => {
    repository.getOrderById.mockResolvedValue({ id: "order-1", status: "pending" });
    const response = await POST(makeRequest({ orderId: "order-1" }));
    expect(response.status).toBe(409);
  });

  it("returns 409 when provider confirmation is still required", async () => {
    repository.getOrderById.mockResolvedValue({ id: "order-1", status: "paid", requiresProviderConfirmation: true, providerUserId: "provider-1", investorId: "investor-1" });
    const response = await POST(makeRequest({ orderId: "order-1" }));
    expect(response.status).toBe(409);
  });

  it("returns 403 when the caller is neither investor nor provider", async () => {
    verifyAccessToken.mockResolvedValue({ sub: "outsider" });
    const response = await POST(makeRequest({ orderId: "order-1" }));
    expect(response.status).toBe(403);
  });

  it("returns 400 when wallet address is missing everywhere", async () => {
    repository.getOrderById.mockResolvedValue({
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
      investorWalletAddress: "",
    });
    const response = await POST(makeRequest({ orderId: "order-1" }));
    expect(response.status).toBe(400);
  });

  it("returns 400 for invalid wallet address input", async () => {
    repository.getOrderById.mockResolvedValue({
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
      investorWalletAddress: "",
    });
    isAddress.mockReturnValue(false);
    const response = await POST(makeRequest({ orderId: "order-1", walletAddress: "bad" }));
    expect(response.status).toBe(400);
  });

  it("returns pending for existing queued requests", async () => {
    repository.getOrderById.mockResolvedValue({
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
      mintRequestedAt: "2026-03-16T08:00:00.000Z",
      investorWalletAddress: "0xwallet",
    });
    repository.getMintRequestById.mockResolvedValue({ mintStatus: "queued", createdAt: "2026-03-16T08:00:00.000Z" });
    const response = await POST(makeRequest({ orderId: "order-1" }));
    expect(response.status).toBe(202);
    await expect(response.json()).resolves.toEqual({ status: "pending", mintRequestedAt: "2026-03-16T08:00:00.000Z" });
  });

  it("returns minted for existing minted requests", async () => {
    repository.getOrderById.mockResolvedValue({
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
      investorWalletAddress: "0xwallet",
    });
    repository.getMintRequestById.mockResolvedValue({ mintStatus: "minted", updatedAt: "2026-03-16T09:00:00.000Z", blockchainTxHash: "0xtx" });
    const response = await POST(makeRequest({ orderId: "order-1" }));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ status: "minted", mintedAt: "2026-03-16T09:00:00.000Z", txHash: "0xtx" });
  });

  it("returns 202 when the processor keeps the request pending", async () => {
    processMint.mockResolvedValue({ status: "pending", mintRequestedAt: "2026-03-16T08:00:00.000Z" });
    const response = await POST(makeRequest({ orderId: "order-1", walletAddress: "0xwallet" }));
    expect(response.status).toBe(202);
    await expect(response.json()).resolves.toEqual({ status: "pending", mintRequestedAt: "2026-03-16T08:00:00.000Z" });
  });

  it("returns 200 when the processor completes minting", async () => {
    const response = await POST(makeRequest({ orderId: "order-1", walletAddress: "0xwallet" }));
    expect(processMint).toHaveBeenCalled();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ status: "minted", mintRequestedAt: "2026-03-16T08:00:00.000Z", mintedAt: "2026-03-16T09:00:00.000Z", txHash: "0xtx" });
  });
});