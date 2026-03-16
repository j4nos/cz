import type {
  AssetTokenizationRepository,
  TokenizationGateway,
} from "@/src/application/interfaces/tokenizationPorts";
import { DomainError } from "@/src/domain/value-objects/errors";
import type { TokenizationResult } from "@/src/domain/entities/tokenization";

export interface TokenizationIdGenerator {
  next(): string;
}

export class TokenizationService {
  constructor(
    private readonly repository: AssetTokenizationRepository,
    private readonly gateway: TokenizationGateway,
    private readonly idGenerator: TokenizationIdGenerator,
  ) {}

  async tokenizeAsset(input: {
    assetId: string;
    userId: string;
    name?: string;
    symbol?: string;
    owner?: string;
    tokenStandard?: string;
  }): Promise<TokenizationResult> {
    const asset = await this.repository.getAssetById(input.assetId);
    if (!asset) {
      throw new DomainError("Asset not found.");
    }

    if (asset.tenantUserId !== input.userId) {
      throw new DomainError("Forbidden.");
    }

    if (asset.tokenAddress) {
      const standard = (input.tokenStandard?.trim() || asset.tokenStandard || "ERC-20").toLowerCase();
      return {
        assetId: input.assetId,
        address: asset.tokenAddress,
        standard,
        supportsErc721: standard === "erc-721",
        runId: asset.latestRunId || "existing",
      };
    }

    const requestId = `contract-deployment:${input.assetId}`;
    const runId = this.idGenerator.next();
    const created = await this.repository.createContractDeploymentRequestIfMissing({
      requestId,
      assetId: input.assetId,
      idempotencyKey: requestId,
      latestRunId: runId,
      tokenStandard: input.tokenStandard?.trim() || asset.tokenStandard || undefined,
    });

    if (!created.created) {
      if (created.request?.tokenAddress) {
        const standard = (
          input.tokenStandard?.trim() ||
          created.request.tokenStandard ||
          asset.tokenStandard ||
          "ERC-20"
        ).toLowerCase();
        return {
          assetId: input.assetId,
          address: created.request.tokenAddress,
          standard,
          supportsErc721: standard === "erc-721",
          runId: created.request.runId,
        };
      }

      const latestAsset = await this.repository.getAssetById(input.assetId);
      if (latestAsset?.tokenAddress && created.request) {
        const standard = (input.tokenStandard?.trim() || latestAsset.tokenStandard || "ERC-20").toLowerCase();
        return {
          assetId: input.assetId,
          address: latestAsset.tokenAddress,
          standard,
          supportsErc721: standard === "erc-721",
          runId: created.request.runId,
        };
      }

      throw new DomainError("Contract deployment already in progress.");
    }

    const request = created.request;
    if (!request) {
      throw new DomainError("Contract deployment request could not be created.");
    }

    try {
      await this.repository.updateContractDeploymentRequest({
        ...request,
        deploymentStatus: "submitting",
        updatedAt: new Date().toISOString(),
      });

      const deployed = await this.gateway.tokenize({
        assetId: input.assetId,
        name: input.name?.trim() || asset.name,
        symbol: input.symbol?.trim() || "ASSET",
        owner: input.owner?.trim() || undefined,
        tokenStandard: input.tokenStandard?.trim() || asset.tokenStandard || undefined,
      });

      await this.repository.updateAssetTokenization({
        assetId: input.assetId,
        tokenAddress: deployed.address,
        latestRunId: runId,
      });

      await this.repository.updateContractDeploymentRequest({
        ...request,
        deploymentStatus: "submitted",
        tokenAddress: deployed.address,
        updatedAt: new Date().toISOString(),
      });

      return {
        assetId: input.assetId,
        address: deployed.address,
        standard: deployed.standard,
        supportsErc721: deployed.supportsErc721,
        runId,
      };
    } catch (error) {
      await this.repository.updateContractDeploymentRequest({
        ...request,
        deploymentStatus: "failed",
        errorMessage: error instanceof Error ? error.message : "Unknown deployment error.",
        updatedAt: new Date().toISOString(),
      });
      throw error;
    }
  }
}
