"use client";

import type { AssetPort } from "@/src/application/interfaces/assetPort";
import { createInvestmentPlatformService, createInvestmentRepository } from "@/src/infrastructure/composition/defaults";
import { AmplifyAssetController } from "@/src/infrastructure/controllers/amplifyAssetController";

let controller: AssetPort | null = null;

export function createAssetController(): AssetPort {
  if (controller) {
    return controller;
  }

  const repository = createInvestmentRepository();
  controller = new AmplifyAssetController(repository, createInvestmentPlatformService(repository));
  return controller;
}
