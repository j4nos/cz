"use client";

import type { Product } from "@/src/domain/entities";
import { getProductsByListingId } from "@/src/ui/queries";
import { getPricingStateFromDb, savePricingStateToDb } from "@/src/ui/localDb";

export interface PricingTier {
  id: string;
  minQuantity: number;
  discountPercent: number;
}

export interface ProductPricingState {
  productId: string;
  listingId: string;
  name: string;
  currency: string;
  unitPrice: number;
  minPurchase: number;
  maxPurchase: number;
  eligibleInvestorType: string;
  supplyTotal: number;
  tiers: PricingTier[];
}

function createDefaultState(product: Product | undefined, listingId: string): ProductPricingState {
  return {
    productId: product?.id ?? `product-${listingId}`,
    listingId,
    name: product?.name ?? "New Product",
    currency: product?.currency ?? "EUR",
    unitPrice: product?.unitPrice ?? 1000,
    minPurchase: product?.minPurchase ?? 1,
    maxPurchase: product?.maxPurchase ?? 10,
    eligibleInvestorType: product?.eligibleInvestorType ?? "ANY",
    supplyTotal: product?.supplyTotal ?? 100,
    tiers: [
      {
        id: `${listingId}-tier-1`,
        minQuantity: 5,
        discountPercent: 0,
      },
    ],
  };
}

export function getPricingState(listingId: string) {
  const fromDb = getPricingStateFromDb(listingId);
  if (fromDb) {
    return fromDb;
  }

  return createDefaultState(getProductsByListingId(listingId)[0], listingId);
}

export function savePricingState(state: ProductPricingState) {
  savePricingStateToDb(state);
}
