"use client";

import {
  getAllAssetsFromDb,
  getAssetByIdFromDb,
  type LocalAsset,
  upsertAssetInDb,
} from "@/src/ui/localDb";

export function getAllAssets(): LocalAsset[] {
  return getAllAssetsFromDb();
}

export function getAssetByIdFromStore(assetId: string): LocalAsset | null {
  return getAssetByIdFromDb(assetId);
}

export function saveAsset(asset: LocalAsset) {
  upsertAssetInDb(asset);
}
