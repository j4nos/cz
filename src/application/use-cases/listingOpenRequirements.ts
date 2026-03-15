import type { Asset, Listing, Product } from "@/src/domain/entities";

function today() {
  return new Date().toISOString().slice(0, 10);
}

function isWithinWindow(startsAt?: string, endsAt?: string, currentDate = today()) {
  if (!startsAt || !endsAt) {
    return false;
  }

  return startsAt <= currentDate && currentDate <= endsAt;
}

export function getListingOpenRequirementError(input: {
  listing: Pick<Listing, "saleStatus" | "startsAt" | "endsAt">;
  asset: Pick<Asset, "imageUrls"> | null;
  products: Product[];
}): string | undefined {
  const { listing, asset, products } = input;

  if (listing.saleStatus !== "closed") {
    return undefined;
  }

  if (!isWithinWindow(listing.startsAt, listing.endsAt)) {
    return "Add a start and end date, and make sure today is between them.";
  }

  if (!asset || asset.imageUrls.length === 0) {
    return "Add at least one photo.";
  }

  if (products.length === 0) {
    return "Add at least one product.";
  }

  return undefined;
}
