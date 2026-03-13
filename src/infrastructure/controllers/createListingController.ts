"use client";

import type { ListingController } from "@/src/application/listingController";
import { AmplifyListingController } from "@/src/infrastructure/controllers/amplifyListingController";

let controller: ListingController | null = null;

export function createListingController(): ListingController {
  if (controller) {
    return controller;
  }

  controller = new AmplifyListingController();
  return controller;
}
