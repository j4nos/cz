"use client";

import type { ListingPort } from "@/src/application/interfaces/listingPort";
import { createInvestmentPlatformService, createInvestmentRepository } from "@/src/infrastructure/composition/defaults";
import { AmplifyListingController } from "@/src/infrastructure/controllers/amplifyListingController";

let controller: ListingPort | null = null;

export function createListingController(): ListingPort {
  if (controller) {
    return controller;
  }

  const repository = createInvestmentRepository();
  controller = new AmplifyListingController(repository, createInvestmentPlatformService(repository));
  return controller;
}
