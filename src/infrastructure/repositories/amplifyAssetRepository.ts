import type { Schema } from "@/amplify/data/resource";
import type { Asset, ContractDeploymentRequest } from "@/src/domain/entities";
import { listAll } from "@/src/infrastructure/amplify/pagination";
import {
  mapAssetRecord,
  type AssetRecord,
} from "@/src/infrastructure/amplify/schemaMappers";
import type {
  AmplifyDataClient,
  AmplifyReadAuthMode,
} from "@/src/infrastructure/repositories/amplifyClient";
import { mapContractDeploymentRequestRecord } from "@/src/infrastructure/repositories/amplifyWorkflowRecords";
import { normalizeStoredPublicPath } from "@/src/infrastructure/storage/publicUrls";

export class AmplifyAssetRepository {
  constructor(
    private readonly client: AmplifyDataClient,
    private readonly readAuthMode?: AmplifyReadAuthMode,
  ) {}

  private withReadAuth(input?: Record<string, unknown>) {
    return {
      ...(input ?? {}),
      ...(this.readAuthMode ? { authMode: this.readAuthMode } : {}),
    };
  }

  async createAsset(input: Asset): Promise<Asset> {
    const response = await this.client.models.Asset.create({
      id: input.id,
      tenantUserId: input.tenantUserId,
      name: input.name,
      country: input.country,
      assetClass: input.assetClass,
      beneficiaryIban: input.beneficiaryIban,
      beneficiaryLabel: input.beneficiaryLabel,
      tokenStandard: input.tokenStandard,
      status: input.status,
      missingDocsCount: input.missingDocsCount,
      tokenAddress: input.tokenAddress,
      latestRunId: input.latestRunId,
      imageUrls: input.imageUrls.map(normalizeStoredPublicPath),
    });

    return response.data ? mapAssetRecord(response.data) : input;
  }

  async getAssetById(id: string): Promise<Asset | null> {
    const response = await this.client.models.Asset.get(
      { id },
      this.withReadAuth(),
    );
    return response.data ? mapAssetRecord(response.data) : null;
  }

  async updateAsset(asset: Asset): Promise<Asset> {
    const response = await this.client.models.Asset.update({
      id: asset.id,
      tenantUserId: asset.tenantUserId,
      name: asset.name,
      country: asset.country,
      assetClass: asset.assetClass,
      beneficiaryIban: asset.beneficiaryIban,
      beneficiaryLabel: asset.beneficiaryLabel,
      tokenStandard: asset.tokenStandard,
      status: asset.status,
      missingDocsCount: asset.missingDocsCount,
      tokenAddress: asset.tokenAddress,
      latestRunId: asset.latestRunId,
      imageUrls: asset.imageUrls.map(normalizeStoredPublicPath),
    });

    return response.data ? mapAssetRecord(response.data) : asset;
  }

  async deleteAsset(assetId: string): Promise<void> {
    await this.client.models.Asset.delete({ id: assetId });
  }

  async updateAssetTokenization(input: {
    assetId: string;
    tokenAddress: string;
    latestRunId: string;
  }): Promise<Asset | null> {
    const current = await this.getAssetById(input.assetId);
    if (!current) {
      return null;
    }

    return this.updateAsset({
      ...current,
      tokenAddress: input.tokenAddress,
      latestRunId: input.latestRunId,
    });
  }

  async listAssets(): Promise<AssetRecord[]> {
    const records = await listAll<Schema["Asset"]["type"]>((nextToken) =>
      this.client.models.Asset.list(
        this.withReadAuth(nextToken ? { nextToken } : undefined),
      ),
    );
    return records.map(mapAssetRecord);
  }

  async getContractDeploymentRequestById(id: string): Promise<ContractDeploymentRequest | null> {
    const response = await this.client.models.ContractDeploymentRequest.get(
      { id },
      this.withReadAuth(),
    );
    return response.data ? mapContractDeploymentRequestRecord(response.data) : null;
  }

  async createContractDeploymentRequestIfMissing(input: {
    requestId: string;
    assetId: string;
    idempotencyKey: string;
    latestRunId: string;
    tokenStandard?: string;
  }): Promise<{ request: ContractDeploymentRequest | null; created: boolean }> {
    const now = new Date().toISOString();
    try {
      const response = await this.client.models.ContractDeploymentRequest.create({
        id: input.requestId,
        assetId: input.assetId,
        idempotencyKey: input.idempotencyKey,
        deploymentStatus: "queued",
        runId: input.latestRunId,
        tokenStandard: input.tokenStandard,
        createdAt: now,
        updatedAt: now,
      });

      if (response.data) {
        return {
          request: mapContractDeploymentRequestRecord(response.data),
          created: true,
        };
      }
    } catch {
      // Duplicate creates can happen under concurrent requests. In that case
      // we treat the existing request as the idempotent winner.
    }

    return {
      request: await this.getContractDeploymentRequestById(input.requestId),
      created: false,
    };
  }

  async updateContractDeploymentRequest(
    request: ContractDeploymentRequest,
  ): Promise<ContractDeploymentRequest> {
    const response = await this.client.models.ContractDeploymentRequest.update({
      id: request.id,
      assetId: request.assetId,
      idempotencyKey: request.idempotencyKey,
      deploymentStatus: request.deploymentStatus,
      runId: request.runId,
      tokenStandard: request.tokenStandard,
      tokenAddress: request.tokenAddress,
      errorCode: request.errorCode,
      errorMessage: request.errorMessage,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
    });

    return response.data ? mapContractDeploymentRequestRecord(response.data) : request;
  }
}
