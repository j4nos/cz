// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DomainError } from "@/src/domain/value-objects/errors";

const { verifyAccessToken, repository, tokenizeAsset } = vi.hoisted(() => ({
  verifyAccessToken: vi.fn(),
  repository: {
    getAssetById: vi.fn(),
    updateAsset: vi.fn(),
  },
  tokenizeAsset: vi.fn(),
}));

vi.mock("@/src/infrastructure/auth/verifyAccessToken", () => ({ verifyAccessToken }));
vi.mock("@/src/infrastructure/repositories/amplifyInvestmentRepository", () => ({
  AmplifyInvestmentRepository: class {
    getAssetById = repository.getAssetById;
    updateAsset = repository.updateAsset;
  },
}));
vi.mock("@/src/application/use-cases/tokenizationService", () => ({
  TokenizationService: class {
    tokenizeAsset = tokenizeAsset;
  },
}));
vi.mock("@/src/infrastructure/gateways/ethersTokenizationGateway", () => ({ EthersTokenizationGateway: class {} }));
vi.mock("@/src/infrastructure/gateways/dynamoDbRequestClaimGateway", () => ({ DynamoDbRequestClaimGateway: class {} }));

import { POST } from "@/app/api/assets/submit/route";

const makeRequest = (body: Record<string, unknown>, withBearer = true) =>
  new Request("http://localhost/api/assets/submit", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(withBearer ? { authorization: "Bearer token" } : {}),
    },
    body: JSON.stringify(body),
  });

describe("POST /api/assets/submit", () => {
  beforeEach(() => {
    verifyAccessToken.mockReset().mockResolvedValue({ sub: "provider-1" });
    repository.getAssetById.mockReset().mockResolvedValue({
      id: "asset-1",
      tenantUserId: "provider-1",
      name: "Asset",
      country: "HU",
      assetClass: "REAL_ESTATE",
      tokenStandard: "ERC-20",
      status: "draft",
      missingDocsCount: 0,
      imageUrls: [],
    });
    repository.updateAsset.mockReset().mockImplementation(async (asset) => asset);
    tokenizeAsset.mockReset().mockResolvedValue({ address: "0xtoken", standard: "erc-20", supportsErc721: false, runId: "run-1" });
  });

  it("returns 401 when bearer token is missing", async () => {
    const response = await POST(makeRequest({ assetId: "asset-1", name: "Asset", country: "HU", assetClass: "REAL_ESTATE" }, false));
    expect(response.status).toBe(401);
  });

  it("returns 400 when required asset fields are missing", async () => {
    const response = await POST(makeRequest({ assetId: "", name: "Asset", country: "HU", assetClass: "REAL_ESTATE" }));
    expect(response.status).toBe(400);
  });

  it("returns 404 when the asset does not exist", async () => {
    repository.getAssetById.mockResolvedValue(null);
    const response = await POST(makeRequest({ assetId: "asset-1", name: "Asset", country: "HU", assetClass: "REAL_ESTATE" }));
    expect(response.status).toBe(404);
  });

  it("returns 403 when the asset belongs to another provider", async () => {
    repository.getAssetById.mockResolvedValue({ id: "asset-1", tenantUserId: "other" });
    const response = await POST(makeRequest({ assetId: "asset-1", name: "Asset", country: "HU", assetClass: "REAL_ESTATE" }));
    expect(response.status).toBe(403);
  });

  it("does not tokenize again when the asset already has a token address", async () => {
    repository.getAssetById.mockResolvedValue({
      id: "asset-1",
      tenantUserId: "provider-1",
      name: "Asset",
      country: "HU",
      assetClass: "REAL_ESTATE",
      tokenStandard: "ERC-20",
      tokenAddress: "0xexisting",
      status: "draft",
      missingDocsCount: 0,
      imageUrls: [],
    });
    const response = await POST(makeRequest({ assetId: "asset-1", name: "Asset", country: "HU", assetClass: "REAL_ESTATE" }));
    expect(response.status).toBe(200);
    expect(tokenizeAsset).not.toHaveBeenCalled();
  });

  it("tokenizes missing contracts before submitting the asset", async () => {
    const response = await POST(makeRequest({ assetId: "asset-1", name: "Asset", country: "HU", assetClass: "REAL_ESTATE" }));
    expect(response.status).toBe(200);
    expect(tokenizeAsset).toHaveBeenCalledWith({ assetId: "asset-1", userId: "provider-1", name: "Asset", tokenStandard: "ERC-20" });
    expect(repository.updateAsset).toHaveBeenCalledWith(expect.objectContaining({ tokenAddress: "0xtoken", status: "submitted" }));
  });

  it("maps DomainError values to the correct statuses", async () => {
    tokenizeAsset.mockRejectedValue(new DomainError("Contract deployment already in progress."));
    const response = await POST(makeRequest({ assetId: "asset-1", name: "Asset", country: "HU", assetClass: "REAL_ESTATE" }));
    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({ error: "Contract deployment already in progress." });
  });
});