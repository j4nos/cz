"use client";

import type { AssetController } from "@/src/application/assetController";
import { AmplifyAssetController } from "@/src/infrastructure/controllers/amplifyAssetController";

let controller: AssetController | null = null;

export function createAssetController(): AssetController {
  if (controller) {
    return controller;
  }

  controller = new AmplifyAssetController();
  return controller;
}
