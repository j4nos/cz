"use client";

import type { ListingPort } from "@/src/application/interfaces/listingPort";
import { AmplifyListingController } from "@/src/infrastructure/controllers/amplifyListingController";

let controller: ListingPort | null = null;

export function createListingController(): ListingPort {
  if (controller) {
    return controller;
  }

  controller = new AmplifyListingController();
  return controller;
}
