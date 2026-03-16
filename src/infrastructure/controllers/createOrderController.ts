"use client";

import type { OrderPort } from "@/src/application/interfaces/orderPort";
import { createInvestmentPlatformService, createInvestmentRepository } from "@/src/infrastructure/composition/defaults";
import { AmplifyOrderController } from "@/src/infrastructure/controllers/amplifyOrderController";

let controller: OrderPort | null = null;

export function createOrderController(): OrderPort {
  if (controller) {
    return controller;
  }

  const repository = createInvestmentRepository();
  controller = new AmplifyOrderController(repository, createInvestmentPlatformService(repository));
  return controller;
}
