import type { Asset } from "@/src/domain/entities";
import type { TokenizationResult } from "@/src/domain/tokenization";

export interface AssetTokenizationRepository {
  getAssetById(id: string): Promise<Asset | null>;
  updateAssetTokenization(input: {
    assetId: string;
    tokenAddress: string;
    latestRunId: string;
  }): Promise<Asset | null>;
}

export interface TokenizationGateway {
  tokenize(input: {
    assetId: string;
    name: string;
    symbol: string;
    owner?: string;
    tokenStandard?: string;
  }): Promise<Omit<TokenizationResult, "assetId" | "runId">>;
}
