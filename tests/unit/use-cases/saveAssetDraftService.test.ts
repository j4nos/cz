import { describe, expect, it, vi } from "vitest";

import { SaveAssetDraftService } from "@/src/application/use-cases/saveAssetDraftService";

describe("SaveAssetDraftService", () => {
  it("returns 400 when required fields are missing", async () => {
    const service = new SaveAssetDraftService({
      getAssetById: vi.fn(),
      createAsset: vi.fn(),
      updateAsset: vi.fn(),
    });

    await expect(
      service.save({
        userId: "provider-1",
        name: "",
        country: "HU",
        assetClass: "REAL_ESTATE",
      }),
    ).resolves.toEqual({
      kind: "error",
      status: 400,
      message: "name, country and assetClass are required.",
    });
  });

  it("returns 403 when editing another provider asset", async () => {
    const service = new SaveAssetDraftService({
      getAssetById: vi.fn().mockResolvedValue({ id: "asset-1", tenantUserId: "other" }),
      createAsset: vi.fn(),
      updateAsset: vi.fn(),
    } as never);

    await expect(
      service.save({
        assetId: "asset-1",
        userId: "provider-1",
        name: "Asset",
        country: "HU",
        assetClass: "REAL_ESTATE",
      }),
    ).resolves.toEqual({
      kind: "error",
      status: 403,
      message: "Forbidden.",
    });
  });

  it("creates a new draft when the asset does not exist", async () => {
    const createAsset = vi.fn().mockImplementation(async (asset) => asset);
    const service = new SaveAssetDraftService({
      getAssetById: vi.fn().mockResolvedValue(null),
      createAsset,
      updateAsset: vi.fn(),
    });

    const result = await service.save({
      assetId: "asset-1",
      userId: "provider-1",
      name: "Asset",
      country: "HU",
      assetClass: "REAL_ESTATE",
    });

    expect(createAsset).toHaveBeenCalledWith(expect.objectContaining({ id: "asset-1", tenantUserId: "provider-1" }));
    expect(result).toMatchObject({ kind: "success", asset: { id: "asset-1", tenantUserId: "provider-1" } });
  });
});
