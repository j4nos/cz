import { describe, expect, it, vi } from "vitest";

import {
  buildAssetAfterContractDeployment,
  buildContractSymbol,
  getContractDeploymentError,
  getDesiredContractStandard,
} from "@/src/application/use-cases/contractDeploymentRules";
import { ContractDeploymentService } from "@/src/application/use-cases/contractDeploymentService";
import { makeAsset } from "@/tests/helpers/factories";

describe("contractDeploymentRules", () => {
  it("returns validation errors for missing asset id, user id or asset details", () => {
    expect(getContractDeploymentError({ userId: "provider-1", name: "Asset", country: "HU", assetClass: "REAL_ESTATE" })).toBe(
      "Missing assetId. Complete earlier steps first.",
    );
    expect(getContractDeploymentError({ assetId: "asset-1", name: "Asset", country: "HU", assetClass: "REAL_ESTATE" })).toBe(
      "Login required.",
    );
    expect(getContractDeploymentError({ assetId: "asset-1", userId: "provider-1", name: "", country: "HU", assetClass: "REAL_ESTATE" })).toBe(
      "Missing asset details. Complete previous steps.",
    );
  });

  it("derives the desired standard and a sanitized contract symbol", () => {
    expect(getDesiredContractStandard({ wizardTokenStandard: "ERC-721", assetTokenStandard: "ERC-20" })).toBe("ERC-721");
    expect(getDesiredContractStandard({ assetTokenStandard: "ERC-20" })).toBe("ERC-20");
    expect(buildContractSymbol("Budapest #1 Office!!")).toBe("BUDAPE");
  });

  it("builds a submitted asset while preserving existing fields", () => {
    const existing = makeAsset({ beneficiaryIban: "HU12", beneficiaryLabel: "Cityzeen", imageUrls: ["/1.jpg"] });

    expect(
      buildAssetAfterContractDeployment({
        existingAsset: existing,
        assetId: existing.id,
        userId: existing.tenantUserId,
        name: "Updated asset",
        country: "AT",
        assetClass: "INFRA",
        tokenStandard: "ERC-721",
        tokenAddress: "0xtoken",
      }),
    ).toMatchObject({
      id: "asset-1",
      tenantUserId: "provider-1",
      beneficiaryIban: "HU12",
      imageUrls: ["/1.jpg"],
      name: "Updated asset",
      country: "AT",
      assetClass: "INFRA",
      tokenStandard: "ERC-721",
      tokenAddress: "0xtoken",
      status: "submitted",
    });
  });
});

describe("ContractDeploymentService", () => {
  it("returns a warning for missing asset details", async () => {
    const service = new ContractDeploymentService(
      { getAssetById: vi.fn(), updateAsset: vi.fn() },
      vi.fn(),
    );

    const result = await service.submit({
      assetId: "asset-1",
      activeUserId: "provider-1",
      accessToken: "token",
      wizardState: { name: "", country: "", assetClass: "", tokenStandard: "ERC-20" },
      asset: null,
    });

    expect(result).toEqual({
      kind: "error",
      message: "Missing asset details. Complete previous steps.",
      tone: "warning",
    });
  });

  it("requires login when a contract must be deployed", async () => {
    const updateAsset = vi.fn();
    const service = new ContractDeploymentService({ getAssetById: vi.fn(), updateAsset }, vi.fn());

    const result = await service.submit({
      assetId: "asset-1",
      activeUserId: "provider-1",
      wizardState: { name: "Asset", country: "HU", assetClass: "REAL_ESTATE", tokenStandard: "ERC-20" },
      asset: makeAsset({ tokenAddress: undefined }),
    });

    expect(result).toEqual({ kind: "error", message: "Login required to deploy contract.", tone: "danger" });
    expect(updateAsset).not.toHaveBeenCalled();
  });

  it("skips deployment when the asset already has a token address", async () => {
    const updateAsset = vi.fn().mockImplementation(async (asset) => asset);
    const deployContract = vi.fn();
    const service = new ContractDeploymentService({ getAssetById: vi.fn(), updateAsset }, deployContract);

    const result = await service.submit({
      assetId: "asset-1",
      activeUserId: "provider-1",
      accessToken: "token",
      wizardState: { name: "Asset", country: "HU", assetClass: "REAL_ESTATE", tokenStandard: "ERC-721" },
      asset: makeAsset({ tokenAddress: "0xexisting" }),
    });

    expect(deployContract).not.toHaveBeenCalled();
    expect(updateAsset).toHaveBeenCalledWith(expect.objectContaining({ tokenAddress: "0xexisting", status: "submitted" }));
    expect(result).toMatchObject({ kind: "success", message: "Asset submitted with contract." });
  });

  it("deploys a contract and persists the returned token address", async () => {
    const updateAsset = vi.fn().mockImplementation(async (asset) => asset);
    const deployContract = vi.fn().mockResolvedValue({ address: "0xdeployed" });
    const service = new ContractDeploymentService({ getAssetById: vi.fn(), updateAsset }, deployContract);

    const result = await service.submit({
      assetId: "asset-1",
      activeUserId: "provider-1",
      accessToken: "token",
      wizardState: { name: "Asset", country: "HU", assetClass: "REAL_ESTATE", tokenStandard: "ERC-721" },
      asset: makeAsset({ tokenAddress: undefined }),
    });

    expect(deployContract).toHaveBeenCalledWith({
      assetId: "asset-1",
      userId: "provider-1",
      name: "Budapest Office",
      tokenStandard: "ERC-721",
      accessToken: "token",
    });
    expect(updateAsset).toHaveBeenCalledWith(expect.objectContaining({ tokenAddress: "0xdeployed", status: "submitted" }));
    expect(result).toMatchObject({ kind: "success", asset: expect.objectContaining({ tokenAddress: "0xdeployed" }) });
  });
});