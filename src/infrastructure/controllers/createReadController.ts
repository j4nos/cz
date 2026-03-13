"use client";

import type { ReadController } from "@/src/application/readController";
import { AmplifyReadController } from "@/src/infrastructure/controllers/amplifyReadController";

let controller: ReadController | null = null;

export function createReadController(): ReadController {
  if (controller) {
    return controller;
  }

  controller = new AmplifyReadController();
  return controller;
}
