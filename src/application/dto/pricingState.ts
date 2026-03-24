import type { Product, ProductCoupon } from "@/src/domain/entities";

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
  coupons: ProductCoupon[];
}

export function createDefaultPricingState(product: Product | undefined, listingId: string): ProductPricingState {
  return {
    productId: product?.id ?? "",
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
    coupons: product?.coupons ?? [],
  };
}
