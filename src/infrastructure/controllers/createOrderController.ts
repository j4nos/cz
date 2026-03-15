"use client";

import type { OrderPort } from "@/src/application/interfaces/orderPort";
import { AmplifyOrderController } from "@/src/infrastructure/controllers/amplifyOrderController";

let controller: OrderPort | null = null;

export function createOrderController(): OrderPort {
  if (controller) {
    return controller;
  }

  controller = new AmplifyOrderController();
  return controller;
}
