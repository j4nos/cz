import type { Asset } from "@/src/domain/entities";
import { normalizeStoredPublicPath, toPublicStorageUrls } from "@/src/infrastructure/storage/publicUrls";

export function buildUpdatedAssetBasics(input: {
  asset: Asset;
  name: string;
  country: string;
  assetClass: string;
  beneficiaryIban: string;
  beneficiaryLabel: string;
}): Asset {
  return {
    ...input.asset,
    name: input.name,
    country: input.country,
    assetClass: input.assetClass,
    beneficiaryIban: input.beneficiaryIban || undefined,
    beneficiaryLabel: input.beneficiaryLabel || undefined,
  };
}

export function mergeAssetImagePaths(input: {
  asset: Pick<Asset, "id" | "imageUrls">;
  uploadedPaths: string[];
}) {
  const existingImages = Array.isArray(input.asset.imageUrls)
    ? input.asset.imageUrls.map(normalizeStoredPublicPath)
    : [];
  const nextImages = Array.from(new Set([...existingImages, ...input.uploadedPaths]));

  return {
    storedPaths: nextImages,
    publicUrls: toPublicStorageUrls(nextImages),
  };
}
