// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DomainError } from "@/src/domain/value-objects/errors";

const { verifyAccessToken, tokenizeAsset } = vi.hoisted(() => ({
  verifyAccessToken: vi.fn(),
  tokenizeAsset: vi.fn(),
}));

vi.mock("@/src/infrastructure/auth/verifyAccessToken", () => ({ verifyAccessToken }));
vi.mock("@/src/application/use-cases/tokenizationService", () => ({
  TokenizationService: class {
    tokenizeAsset = tokenizeAsset;
  },
}));
vi.mock("@/src/infrastructure/repositories/amplifyInvestmentRepository", () => ({ AmplifyInvestmentRepository: class {} }));
vi.mock("@/src/infrastructure/gateways/ethersTokenizationGateway", () => ({ EthersTokenizationGateway: class {} }));
vi.mock("@/src/infrastructure/gateways/dynamoDbRequestClaimGateway", () => ({ DynamoDbRequestClaimGateway: class {} }));

import { POST } from "@/app/api/tokenize-asset/route";

const makeRequest = (body: Record<string, unknown>, withBearer = true) =>
  new Request("http://localhost/api/tokenize-asset", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(withBearer ? { authorization: "Bearer token" } : {}),
    },
    body: JSON.stringify(body),
  });

describe("POST /api/tokenize-asset", () => {
  beforeEach(() => {
    verifyAccessToken.mockReset().mockResolvedValue({ sub: "provider-1" });
    tokenizeAsset.mockReset().mockResolvedValue({
      assetId: "asset-1",
      address: "0xcontract",
      standard: "erc-721",
      supportsErc721: true,
      runId: "run-1",
    });
  });

  it("returns 401 when bearer token is missing", async () => {
    const response = await POST(makeRequest({ assetId: "asset-1" }, false));
    expect(response.status).toBe(401);
  });

  it("returns 401 when token payload is invalid", async () => {
    verifyAccessToken.mockResolvedValue({});
    const response = await POST(makeRequest({ assetId: "asset-1" }));
    expect(response.status).toBe(401);
  });

  it("returns 400 when assetId is missing", async () => {
    const response = await POST(makeRequest({}));
    expect(response.status).toBe(400);
  });

  it("maps asset not found to 404", async () => {
    tokenizeAsset.mockRejectedValue(new DomainError("Asset not found."));
    const response = await POST(makeRequest({ assetId: "asset-1" }));
    expect(response.status).toBe(404);
  });

  it("maps forbidden to 403", async () => {
    tokenizeAsset.mockRejectedValue(new DomainError("Forbidden."));
    const response = await POST(makeRequest({ assetId: "asset-1" }));
    expect(response.status).toBe(403);
  });

  it("maps in-progress errors to 409", async () => {
    tokenizeAsset.mockRejectedValue(new DomainError("Contract deployment already in progress."));
    const response = await POST(makeRequest({ assetId: "asset-1" }));
    expect(response.status).toBe(409);
  });

  it("returns the tokenization payload on success", async () => {
    const response = await POST(makeRequest({ assetId: "asset-1", tokenStandard: "erc-721" }));
    expect(tokenizeAsset).toHaveBeenCalledWith({ assetId: "asset-1", userId: "provider-1", name: undefined, symbol: undefined, owner: undefined, tokenStandard: "erc-721" });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      address: "0xcontract",
      standard: "erc-721",
      supportsErc721: true,
      runId: "run-1",
    });
  });
});