"use client";

import type { PricingPort } from "@/src/application/interfaces/pricingPort";
import { AmplifyPricingController } from "@/src/infrastructure/controllers/amplifyPricingController";

let controller: PricingPort | null = null;

export function createPricingController(): PricingPort {
  if (controller) {
    return controller;
  }

  controller = new AmplifyPricingController();
  return controller;
}
