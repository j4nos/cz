import type { Asset, ContractDeploymentRequest } from "@/src/domain/entities";
import type { TokenizationResult } from "@/src/domain/entities/tokenization";

export interface AssetTokenizationRepository {
  getAssetById(id: string): Promise<Asset | null>;
  getContractDeploymentRequestById(id: string): Promise<ContractDeploymentRequest | null>;
  createContractDeploymentRequestIfMissing(input: {
    requestId: string;
    assetId: string;
    idempotencyKey: string;
    latestRunId: string;
    tokenStandard?: string;
  }): Promise<{ request: ContractDeploymentRequest | null; created: boolean }>;
  updateContractDeploymentRequest(
    request: ContractDeploymentRequest,
  ): Promise<ContractDeploymentRequest>;
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
