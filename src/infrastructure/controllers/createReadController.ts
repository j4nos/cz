"use client";

import type { ReadPort } from "@/src/application/interfaces/readPort";
import { createInvestmentRepository } from "@/src/infrastructure/composition/defaults";
import { AmplifyReadController } from "@/src/infrastructure/controllers/amplifyReadController";

let controller: ReadPort | null = null;

export function createReadController(): ReadPort {
  if (controller) {
    return controller;
  }

  controller = new AmplifyReadController(createInvestmentRepository());
  return controller;
}
