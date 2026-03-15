"use client";

import type { ReadPort } from "@/src/application/interfaces/readPort";
import { AmplifyReadController } from "@/src/infrastructure/controllers/amplifyReadController";

let controller: ReadPort | null = null;

export function createReadController(): ReadPort {
  if (controller) {
    return controller;
  }

  controller = new AmplifyReadController();
  return controller;
}
