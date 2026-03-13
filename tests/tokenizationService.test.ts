import { describe, expect, it } from "vitest";

import type { AssetTokenizationRepository, TokenizationGateway } from "@/src/application/tokenizationPorts";
import { TokenizationService } from "@/src/application/tokenizationService";
import type { Asset } from "@/src/domain/entities";
import { DomainError } from "@/src/domain/errors";

class FakeAssetTokenizationRepository implements AssetTokenizationRepository {
  constructor(private readonly asset: Asset | null) {}

  updated: { assetId: string; tokenAddress: string; latestRunId: string } | null = null;

  async getAssetById(): Promise<Asset | null> {
    return this.asset;
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

describe("TokenizationService", () => {
  it("tokenizes an owned asset and stores the token address", async () => {
    const repository = new FakeAssetTokenizationRepository({
      id: "asset-1",
      tenantUserId: "provider-1",
      name: "Budapest Office",
      country: "HU",
      assetClass: "REAL_ESTATE",
      tokenStandard: "ERC-721",
      status: "DRAFT",
      missingDocsCount: 0,
      imageUrls: [],
    });
    const service = new TokenizationService(
      repository,
      new FakeTokenizationGateway(),
      new FixedRunIdGenerator(),
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
  });

  it("rejects tokenization for another user's asset", async () => {
    const repository = new FakeAssetTokenizationRepository({
      id: "asset-1",
      tenantUserId: "provider-1",
      name: "Budapest Office",
      country: "HU",
      assetClass: "REAL_ESTATE",
      status: "DRAFT",
      missingDocsCount: 0,
      imageUrls: [],
    });
    const service = new TokenizationService(
      repository,
      new FakeTokenizationGateway(),
      new FixedRunIdGenerator(),
    );

    await expect(
      service.tokenizeAsset({
        assetId: "asset-1",
        userId: "provider-2",
      }),
    ).rejects.toBeInstanceOf(DomainError);
  });
});
