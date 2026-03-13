"use client";

import type { OrderController } from "@/src/application/orderController";
import { AmplifyOrderController } from "@/src/infrastructure/controllers/amplifyOrderController";

let controller: OrderController | null = null;

export function createOrderController(): OrderController {
  if (controller) {
    return controller;
  }

  controller = new AmplifyOrderController();
  return controller;
}
