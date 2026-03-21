// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const { verifyAccessToken, repository } = vi.hoisted(() => ({
  verifyAccessToken: vi.fn(),
  repository: {
    getAssetById: vi.fn(),
    createAsset: vi.fn(),
    updateAsset: vi.fn(),
  },
}));

vi.mock("@/src/infrastructure/auth/verifyAccessToken", () => ({ verifyAccessToken }));
vi.mock("@/src/infrastructure/repositories/amplifyInvestmentRepository", () => ({
  AmplifyInvestmentRepository: class {
    getAssetById = repository.getAssetById;
    createAsset = repository.createAsset;
    updateAsset = repository.updateAsset;
  },
}));

import { POST } from "@/app/api/assets/draft/route";

const makeRequest = (body: Record<string, unknown>, withBearer = true) =>
  new Request("http://localhost/api/assets/draft", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(withBearer ? { authorization: "Bearer token" } : {}),
    },
    body: JSON.stringify(body),
  });

describe("POST /api/assets/draft", () => {
  beforeEach(() => {
    verifyAccessToken.mockReset().mockResolvedValue({ sub: "provider-1" });
    repository.getAssetById.mockReset().mockResolvedValue(null);
    repository.createAsset.mockReset().mockImplementation(async (asset) => asset);
    repository.updateAsset.mockReset().mockImplementation(async (asset) => asset);
  });

  it("returns 401 when bearer token is missing", async () => {
    const response = await POST(makeRequest({ name: "Asset", country: "HU", assetClass: "REAL_ESTATE" }, false));
    expect(response.status).toBe(401);
  });

  it("returns 500 when the token is invalid", async () => {
    verifyAccessToken.mockRejectedValue(
      new Error("Invalid login token. Couldn't verify signed token."),
    );
    const response = await POST(makeRequest({ name: "Asset", country: "HU", assetClass: "REAL_ESTATE" }));
    expect(response.status).toBe(500);
  });

  it("returns 400 when required fields are missing", async () => {
    const response = await POST(makeRequest({ name: "", country: "HU", assetClass: "REAL_ESTATE" }));
    expect(response.status).toBe(400);
  });

  it("returns 403 when updating another provider's asset", async () => {
    repository.getAssetById.mockResolvedValue({ id: "asset-1", tenantUserId: "other" });
    const response = await POST(makeRequest({ assetId: "asset-1", name: "Asset", country: "HU", assetClass: "REAL_ESTATE" }));
    expect(response.status).toBe(403);
  });

  it("creates a new asset draft", async () => {
    const response = await POST(makeRequest({ assetId: "asset-1", name: "Asset", country: "HU", assetClass: "REAL_ESTATE" }));
    expect(response.status).toBe(200);
    expect(repository.createAsset).toHaveBeenCalled();
    await expect(response.json()).resolves.toMatchObject({ asset: expect.objectContaining({ id: "asset-1", tenantUserId: "provider-1" }) });
  });

  it("updates an existing asset draft", async () => {
    repository.getAssetById.mockResolvedValue({ id: "asset-1", tenantUserId: "provider-1", status: "draft", missingDocsCount: 0, imageUrls: [] });
    const response = await POST(makeRequest({ assetId: "asset-1", name: "Updated", country: "AT", assetClass: "INFRA" }));
    expect(response.status).toBe(200);
    expect(repository.updateAsset).toHaveBeenCalledWith(expect.objectContaining({ id: "asset-1", name: "Updated", country: "AT" }));
  });
});
