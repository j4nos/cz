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

    const runId = this.idGenerator.next();
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

    return {
      assetId: input.assetId,
      address: deployed.address,
      standard: deployed.standard,
      supportsErc721: deployed.supportsErc721,
      runId,
    };
  }
}
