"use client";

import type { PricingController } from "@/src/application/pricingController";
import { AmplifyPricingController } from "@/src/infrastructure/controllers/amplifyPricingController";

let controller: PricingController | null = null;

export function createPricingController(): PricingController {
  if (controller) {
    return controller;
  }

  controller = new AmplifyPricingController();
  return controller;
}
