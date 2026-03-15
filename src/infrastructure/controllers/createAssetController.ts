"use client";

import type { AssetPort } from "@/src/application/interfaces/assetPort";
import { AmplifyAssetController } from "@/src/infrastructure/controllers/amplifyAssetController";

let controller: AssetPort | null = null;

export function createAssetController(): AssetPort {
  if (controller) {
    return controller;
  }

  controller = new AmplifyAssetController();
  return controller;
}
