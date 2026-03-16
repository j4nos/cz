import { describe, expect, it } from "vitest";

import type { RequestClaimPort } from "@/src/application/interfaces/requestClaimPort";
import type { AssetTokenizationRepository, TokenizationGateway } from "@/src/application/interfaces/tokenizationPorts";
import { TokenizationService } from "@/src/application/use-cases/tokenizationService";
import type { Asset, ContractDeploymentRequest } from "@/src/domain/entities";
import { DomainError } from "@/src/domain/value-objects/errors";

class FakeAssetTokenizationRepository implements AssetTokenizationRepository {
  constructor(private readonly asset: Asset | null) {}

  updated: { assetId: string; tokenAddress: string; latestRunId: string } | null = null;
  createdRequest: { requestId: string; assetId: string; idempotencyKey: string; latestRunId: string; tokenStandard?: string } | null = null;
  updatedRequest: ContractDeploymentRequest | null = null;

  async getAssetById(): Promise<Asset | null> {
    return this.asset;
  }

  async getContractDeploymentRequestById(): Promise<ContractDeploymentRequest | null> {
    return null;
  }

  async createContractDeploymentRequestIfMissing(input: {
    requestId: string;
    assetId: string;
    idempotencyKey: string;
    latestRunId: string;
    tokenStandard?: string;
  }): Promise<{ request: ContractDeploymentRequest | null; created: boolean }> {
    this.createdRequest = input;
    if (!this.asset || this.asset.tokenAddress) {
      return { request: null, created: false };
    }

    return {
      created: true,
      request: {
        id: input.requestId,
        assetId: input.assetId,
        idempotencyKey: input.idempotencyKey,
        deploymentStatus: "queued",
        runId: input.latestRunId,
        tokenStandard: input.tokenStandard,
        createdAt: "2026-03-16T00:00:00.000Z",
        updatedAt: "2026-03-16T00:00:00.000Z",
      },
    };
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
  }): Promise<Asset | null> {
    this.updated = input;
    if (!this.asset) {
      return null;
    }

    return {
      ...this.asset,
      tokenAddress: input.tokenAddress,
      latestRunId: input.latestRunId,
    };
  }
}

class FakeTokenizationGateway implements TokenizationGateway {
  async tokenize(): Promise<{ address: string; standard: string; supportsErc721: boolean }> {
    return {
      address: "0xcontract",
      standard: "erc-721",
      supportsErc721: true,
    };
  }
}

class FixedRunIdGenerator {
  next(): string {
    return "run-1";
  }
}

class FakeRequestClaimPort implements RequestClaimPort {
  async claimContractDeploymentRequest(): Promise<boolean> {
    return true;
  }

  async claimMintRequest(): Promise<boolean> {
    return true;
  }
}

describe("TokenizationService", () => {
  it("tokenizes an owned asset and stores the token address", async () => {
    const repository = new FakeAssetTokenizationRepository({
      id: "asset-1",
      tenantUserId: "provider-1",
      name: "Budapest Office",
      country: "HU",
      assetClass: "REAL_ESTATE",
      tokenStandard: "ERC-721",
      status: "draft",
      missingDocsCount: 0,
      imageUrls: [],
    });
    const service = new TokenizationService(
      repository,
      new FakeTokenizationGateway(),
      new FixedRunIdGenerator(),
      new FakeRequestClaimPort(),
    );

    const result = await service.tokenizeAsset({
      assetId: "asset-1",
      userId: "provider-1",
      tokenStandard: "erc-721",
    });

    expect(result.address).toBe("0xcontract");
    expect(result.runId).toBe("run-1");
    expect(repository.updated).toEqual({
      assetId: "asset-1",
      tokenAddress: "0xcontract",
      latestRunId: "run-1",
    });
    expect(repository.createdRequest).toEqual({
      requestId: "contract-deployment:asset-1",
      assetId: "asset-1",
      idempotencyKey: "contract-deployment:asset-1",
      latestRunId: "run-1",
      tokenStandard: "erc-721",
    });
  });

  it("rejects tokenization for another user's asset", async () => {
    const repository = new FakeAssetTokenizationRepository({
      id: "asset-1",
      tenantUserId: "provider-1",
      name: "Budapest Office",
      country: "HU",
      assetClass: "REAL_ESTATE",
      status: "draft",
      missingDocsCount: 0,
      imageUrls: [],
    });
    const service = new TokenizationService(
      repository,
      new FakeTokenizationGateway(),
      new FixedRunIdGenerator(),
      new FakeRequestClaimPort(),
    );

    await expect(
      service.tokenizeAsset({
        assetId: "asset-1",
        userId: "provider-2",
      }),
    ).rejects.toBeInstanceOf(DomainError);
  });
});
