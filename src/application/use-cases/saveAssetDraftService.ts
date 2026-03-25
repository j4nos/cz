import type { Asset } from "@/src/domain/entities";
import type { InvestmentRepository } from "@/src/domain/repositories/investmentRepository";

export class SaveAssetDraftService {
  constructor(private readonly repository: Pick<InvestmentRepository, "getAssetById" | "createAsset" | "updateAsset">) {}

  async save(input: {
    assetId?: string;
    userId: string;
    name: string;
    country: string;
    assetClass: string;
    tokenStandard?: string;
  }): Promise<
    | { kind: "error"; status: 400 | 403; message: string }
    | { kind: "success"; asset: Asset }
  > {
    const assetId = input.assetId?.trim() || crypto.randomUUID();
    const name = input.name.trim();
    const country = input.country.trim();
    const assetClass = input.assetClass.trim();
    const tokenStandard = input.tokenStandard?.trim() || "ERC-20";

    if (!name || !country || !assetClass) {
      return {
        kind: "error",
        status: 400,
        message: "name, country and assetClass are required.",
      };
    }

    const existingAsset = await this.repository.getAssetById(assetId);
    if (existingAsset && existingAsset.tenantUserId !== input.userId) {
      return {
        kind: "error",
        status: 403,
        message: "Forbidden.",
      };
    }

    const asset: Asset = existingAsset
      ? {
          ...existingAsset,
          name,
          country,
          assetClass,
          tokenStandard,
        }
      : {
          id: assetId,
          tenantUserId: input.userId,
          name,
          country,
          assetClass,
          tokenStandard,
          status: "draft",
          missingDocsCount: 0,
          imageUrls: [],
        };

    return {
      kind: "success",
      asset: existingAsset
        ? await this.repository.updateAsset(asset)
        : await this.repository.createAsset(asset),
    };
  }
}
