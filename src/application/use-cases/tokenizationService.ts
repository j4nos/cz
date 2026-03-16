import type {
  AssetTokenizationRepository,
  TokenizationGateway,
} from "@/src/application/interfaces/tokenizationPorts";
import type { RequestClaimPort } from "@/src/application/interfaces/requestClaimPort";
import { DomainError } from "@/src/domain/value-objects/errors";
import type { TokenizationResult } from "@/src/domain/entities/tokenization";
import { normalizeTokenStandard } from "@/src/domain/value-objects/tokenStandard";

export interface TokenizationIdGenerator {
  next(): string;
}

export class TokenizationService {
  constructor(
    private readonly repository: AssetTokenizationRepository,
    private readonly gateway: TokenizationGateway,
    private readonly idGenerator: TokenizationIdGenerator,
    private readonly requestClaimPort: RequestClaimPort,
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
      throw new DomainError({ code: "ASSET_NOT_FOUND" });
    }

    if (asset.tenantUserId !== input.userId) {
      throw new DomainError({ code: "FORBIDDEN" });
    }

    if (asset.tokenAddress) {
      const standard = normalizeTokenStandard(input.tokenStandard?.trim() || asset.tokenStandard);
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
        const standard = normalizeTokenStandard(
          input.tokenStandard?.trim() || created.request.tokenStandard || asset.tokenStandard,
        );
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
        const standard = normalizeTokenStandard(input.tokenStandard?.trim() || latestAsset.tokenStandard);
        return {
          assetId: input.assetId,
          address: latestAsset.tokenAddress,
          standard,
          supportsErc721: standard === "erc-721",
          runId: created.request.runId,
        };
      }

      throw new DomainError({ code: "CONTRACT_DEPLOYMENT_IN_PROGRESS" });
    }

    const request = created.request;
    if (!request) {
      throw new DomainError({ code: "CONTRACT_DEPLOYMENT_REQUEST_FAILED" });
    }

    const submittingAt = new Date().toISOString();
    const claimed = await this.requestClaimPort.claimContractDeploymentRequest({
      requestId,
      claimedAt: submittingAt,
    });

    if (!claimed) {
      const currentRequest = await this.repository.getContractDeploymentRequestById(requestId);
      const latestAsset = await this.repository.getAssetById(input.assetId);
      if (currentRequest?.tokenAddress) {
        const standard = normalizeTokenStandard(
          input.tokenStandard?.trim() ||
            currentRequest.tokenStandard ||
            latestAsset?.tokenStandard ||
            asset.tokenStandard,
        );
        return {
          assetId: input.assetId,
          address: currentRequest.tokenAddress,
          standard,
          supportsErc721: standard === "erc-721",
          runId: currentRequest.runId,
        };
      }

      if (latestAsset?.tokenAddress) {
        const standard = normalizeTokenStandard(
          input.tokenStandard?.trim() || latestAsset.tokenStandard || asset.tokenStandard,
        );
        return {
          assetId: input.assetId,
          address: latestAsset.tokenAddress,
          standard,
          supportsErc721: standard === "erc-721",
          runId: currentRequest?.runId ?? latestAsset.latestRunId ?? runId,
        };
      }

      throw new DomainError({ code: "CONTRACT_DEPLOYMENT_IN_PROGRESS" });
    }

    try {
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
