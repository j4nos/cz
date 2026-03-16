import { describe, expect, it, vi } from "vitest";

import type { RequestClaimPort } from "@/src/application/interfaces/requestClaimPort";
import type {
  AssetTokenizationRepository,
  TokenizationGateway,
} from "@/src/application/interfaces/tokenizationPorts";
import { TokenizationService } from "@/src/application/use-cases/tokenizationService";
import type { ContractDeploymentRequest } from "@/src/domain/entities";
import { DomainError } from "@/src/domain/value-objects/errors";
import { makeAsset, makeContractDeploymentRequest } from "@/tests/helpers/factories";

class FakeRepository implements AssetTokenizationRepository {
  asset: ReturnType<typeof makeAsset> | null = makeAsset();
  createResponse: { request: ContractDeploymentRequest | null; created: boolean } = {
    request: makeContractDeploymentRequest(),
    created: true,
  };
  requestById: ContractDeploymentRequest | null = null;
  updatedAssetTokenization: { assetId: string; tokenAddress: string; latestRunId: string } | null = null;
  updatedRequest: ContractDeploymentRequest | null = null;

  async getAssetById(): Promise<typeof this.asset | null> {
    return this.asset;
  }

  async getContractDeploymentRequestById(): Promise<ContractDeploymentRequest | null> {
    return this.requestById;
  }

  async createContractDeploymentRequestIfMissing() {
    return this.createResponse;
  }

  async updateContractDeploymentRequest(
    request: ContractDeploymentRequest,
  ): Promise<ContractDeploymentRequest> {
    this.updatedRequest = request;
    return request;
  }

  async updateAssetTokenization(input: {
    assetId: string;
    tokenAddress: string;
    latestRunId: string;
  }) {
    this.updatedAssetTokenization = input;
    return this.asset ? { ...this.asset, tokenAddress: input.tokenAddress, latestRunId: input.latestRunId } : null;
  }
}

class FixedIdGenerator {
  next() {
    return "run-1";
  }
}

function makeClaimPort(claimed = true): RequestClaimPort {
  return {
    claimContractDeploymentRequest: vi.fn().mockResolvedValue(claimed),
    claimMintRequest: vi.fn(),
  };
}

function makeGateway(result?: { address: string; standard: string; supportsErc721: boolean }): TokenizationGateway {
  return {
    tokenize: vi.fn().mockResolvedValue(
      result ?? {
        address: "0xcontract",
        standard: "erc-721",
        supportsErc721: true,
      },
    ),
  };
}

describe("TokenizationService", () => {
  it("throws when the asset is missing", async () => {
    const repository = new FakeRepository();
    repository.asset = null;
    const service = new TokenizationService(repository, makeGateway(), new FixedIdGenerator(), makeClaimPort());

    await expect(service.tokenizeAsset({ assetId: "asset-1", userId: "provider-1" })).rejects.toMatchObject({
      message: "Asset not found.",
    });
  });

  it("rejects tokenization for another user's asset", async () => {
    const repository = new FakeRepository();
    const service = new TokenizationService(repository, makeGateway(), new FixedIdGenerator(), makeClaimPort());

    await expect(service.tokenizeAsset({ assetId: "asset-1", userId: "provider-2" })).rejects.toBeInstanceOf(
      DomainError,
    );
  });

  it("returns the existing token address without creating a new deployment", async () => {
    const repository = new FakeRepository();
    repository.asset = makeAsset({ tokenAddress: "0xexisting", latestRunId: "existing-run", tokenStandard: "ERC-721" });
    const gateway = makeGateway();
    const service = new TokenizationService(repository, gateway, new FixedIdGenerator(), makeClaimPort());

    const result = await service.tokenizeAsset({ assetId: "asset-1", userId: "provider-1" });

    expect(result).toEqual({
      assetId: "asset-1",
      address: "0xexisting",
      standard: "erc-721",
      supportsErc721: true,
      runId: "existing-run",
    });
    expect(gateway.tokenize).not.toHaveBeenCalled();
  });

  it("returns an idempotent result when an existing request already has a token address", async () => {
    const repository = new FakeRepository();
    repository.createResponse = {
      created: false,
      request: makeContractDeploymentRequest({ tokenAddress: "0xrequest", runId: "run-2", tokenStandard: "erc-20" }),
    };
    const service = new TokenizationService(repository, makeGateway(), new FixedIdGenerator(), makeClaimPort());

    const result = await service.tokenizeAsset({ assetId: "asset-1", userId: "provider-1" });

    expect(result).toEqual({
      assetId: "asset-1",
      address: "0xrequest",
      standard: "erc-20",
      supportsErc721: false,
      runId: "run-2",
    });
  });

  it("throws already in progress when another claim holds the request and no token is available", async () => {
    const repository = new FakeRepository();
    repository.requestById = makeContractDeploymentRequest();
    const service = new TokenizationService(repository, makeGateway(), new FixedIdGenerator(), makeClaimPort(false));

    await expect(service.tokenizeAsset({ assetId: "asset-1", userId: "provider-1" })).rejects.toMatchObject({
      message: "Contract deployment already in progress.",
    });
  });

  it("stores the token address and marks the request submitted after a successful deployment", async () => {
    const repository = new FakeRepository();
    const gateway = makeGateway({ address: "0xdeployed", standard: "erc-20", supportsErc721: false });
    const service = new TokenizationService(repository, gateway, new FixedIdGenerator(), makeClaimPort());

    const result = await service.tokenizeAsset({ assetId: "asset-1", userId: "provider-1", tokenStandard: "erc-20" });

    expect(result).toEqual({
      assetId: "asset-1",
      address: "0xdeployed",
      standard: "erc-20",
      supportsErc721: false,
      runId: "run-1",
    });
    expect(repository.updatedAssetTokenization).toEqual({
      assetId: "asset-1",
      tokenAddress: "0xdeployed",
      latestRunId: "run-1",
    });
    expect(repository.updatedRequest).toMatchObject({
      deploymentStatus: "submitted",
      tokenAddress: "0xdeployed",
    });
  });

  it("marks the request failed when the gateway throws", async () => {
    const repository = new FakeRepository();
    const gateway: TokenizationGateway = {
      tokenize: vi.fn().mockRejectedValue(new Error("gateway down")),
    };
    const service = new TokenizationService(repository, gateway, new FixedIdGenerator(), makeClaimPort());

    await expect(service.tokenizeAsset({ assetId: "asset-1", userId: "provider-1" })).rejects.toThrow(
      "gateway down",
    );
    expect(repository.updatedRequest).toMatchObject({
      deploymentStatus: "failed",
      errorMessage: "gateway down",
    });
  });
});