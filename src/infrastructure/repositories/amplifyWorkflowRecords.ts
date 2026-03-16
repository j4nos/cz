import type { Schema } from "@/amplify/data/resource";
import type { ContractDeploymentRequest, MintRequest } from "@/src/domain/entities";

export function mapContractDeploymentRequestRecord(
  item: Schema["ContractDeploymentRequest"]["type"],
): ContractDeploymentRequest {
  return {
    id: item.id,
    assetId: item.assetId,
    idempotencyKey: item.idempotencyKey,
    deploymentStatus: normalizeContractDeploymentStatus(item.deploymentStatus),
    runId: item.runId,
    tokenStandard: item.tokenStandard ?? undefined,
    tokenAddress: item.tokenAddress ?? undefined,
    errorCode: item.errorCode ?? undefined,
    errorMessage: item.errorMessage ?? undefined,
    createdAt: item.createdAt ?? new Date().toISOString(),
    updatedAt: item.updatedAt ?? item.createdAt ?? new Date().toISOString(),
  };
}

export function mapMintRequestRecord(item: Schema["MintRequest"]["type"]): MintRequest {
  return {
    id: item.id,
    orderId: item.orderId,
    assetId: item.assetId,
    idempotencyKey: item.idempotencyKey,
    mintStatus: normalizeMintRequestStatus(item.mintStatus),
    walletAddress: item.walletAddress ?? undefined,
    blockchainTxHash: item.blockchainTxHash ?? undefined,
    tokenId: item.tokenId ?? undefined,
    retryCount: item.retryCount ?? 0,
    errorCode: item.errorCode ?? undefined,
    errorMessage: item.errorMessage ?? undefined,
    createdAt: item.createdAt ?? new Date().toISOString(),
    updatedAt: item.updatedAt ?? item.createdAt ?? new Date().toISOString(),
  };
}

function normalizeContractDeploymentStatus(value: string): ContractDeploymentRequest["deploymentStatus"] {
  switch (value) {
    case "queued":
    case "submitting":
    case "submitted":
    case "failed":
      return value;
    default:
      return "failed";
  }
}

function normalizeMintRequestStatus(value: string): MintRequest["mintStatus"] {
  switch (value) {
    case "queued":
    case "submitting":
    case "submitted":
    case "minted":
    case "failed":
      return value;
    default:
      return "failed";
  }
}