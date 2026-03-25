import { describe, expect, it, vi } from "vitest";

import { SubmitAssetService } from "@/src/application/use-cases/submitAssetService";
import { DomainError } from "@/src/domain/value-objects/errors";
import { makeAsset } from "@/tests/helpers/factories";

describe("SubmitAssetService", () => {
  it("throws when the asset is missing", async () => {
    const service = new SubmitAssetService(
      {
        getAssetById: vi.fn().mockResolvedValue(null),
        updateAsset: vi.fn(),
      },
      vi.fn(),
    );

    await expect(
      service.submit({
        assetId: "asset-1",
        userId: "provider-1",
        name: "Asset",
        country: "HU",
        assetClass: "REAL_ESTATE",
        tokenStandard: "ERC-20",
      }),
    ).rejects.toBeInstanceOf(DomainError);
  });

  it("throws when another provider owns the asset", async () => {
    const service = new SubmitAssetService(
      {
        getAssetById: vi.fn().mockResolvedValue(makeAsset({ tenantUserId: "other-provider" })),
        updateAsset: vi.fn(),
      },
      vi.fn(),
    );

    await expect(
      service.submit({
        assetId: "asset-1",
        userId: "provider-1",
        name: "Asset",
        country: "HU",
        assetClass: "REAL_ESTATE",
        tokenStandard: "ERC-20",
      }),
    ).rejects.toMatchObject({ message: "Forbidden." });
  });

  it("does not tokenize again when the asset already has a token address", async () => {
    const updateAsset = vi.fn().mockImplementation(async (asset) => asset);
    const tokenizeAsset = vi.fn();
    const service = new SubmitAssetService(
      {
        getAssetById: vi.fn().mockResolvedValue(makeAsset({ tokenAddress: "0xexisting" })),
        updateAsset,
      },
      tokenizeAsset,
    );

    const result = await service.submit({
      assetId: "asset-1",
      userId: "provider-1",
      name: "Updated Asset",
      country: "AT",
      assetClass: "INFRA",
      tokenStandard: "ERC-721",
    });

    expect(tokenizeAsset).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      tokenAddress: "0xexisting",
      status: "submitted",
      tokenStandard: "ERC-721",
      country: "AT",
      assetClass: "INFRA",
    });
  });

  it("tokenizes and saves the submitted asset when needed", async () => {
    const updateAsset = vi.fn().mockImplementation(async (asset) => asset);
    const tokenizeAsset = vi.fn().mockResolvedValue({ address: "0xtoken" });
    const service = new SubmitAssetService(
      {
        getAssetById: vi.fn().mockResolvedValue(makeAsset({ tokenAddress: undefined })),
        updateAsset,
      },
      tokenizeAsset,
    );

    const result = await service.submit({
      assetId: "asset-1",
      userId: "provider-1",
      name: "Updated Asset",
      country: "AT",
      assetClass: "INFRA",
      tokenStandard: "ERC-721",
    });

    expect(tokenizeAsset).toHaveBeenCalledWith({
      assetId: "asset-1",
      userId: "provider-1",
      name: "Updated Asset",
      tokenStandard: "ERC-721",
    });
    expect(updateAsset).toHaveBeenCalledWith(expect.objectContaining({
      tokenAddress: "0xtoken",
      status: "submitted",
    }));
    expect(result).toMatchObject({
      tokenAddress: "0xtoken",
      status: "submitted",
    });
  });
});
