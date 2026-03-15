import type { Asset } from "@/src/domain/entities";

export interface AssetPort {
  createAssetWithMedia: (input: {
    tenantUserId: string;
    tenantEmail?: string;
    tenantCountry?: string;
    name: string;
    country: string;
    assetClass: string;
    tokenStandard?: string;
    imageUrls: string[];
    documents: { name: string }[];
  }) => Promise<Asset | null>;
  updateAsset: (asset: Asset) => Promise<Asset>;
  deleteAsset: (assetId: string) => Promise<void>;
}
