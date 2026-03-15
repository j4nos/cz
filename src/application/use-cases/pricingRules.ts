import type { PricingTier, ProductPricingState } from "@/src/application/dto/pricingState";

export function getPricingStateError(state: ProductPricingState): string | undefined {
  if (!state.name.trim()) {
    return "Product name is required.";
  }

  if (state.unitPrice < 0) {
    return "Unit price must be zero or greater.";
  }

  if (state.minPurchase <= 0 || state.maxPurchase < state.minPurchase) {
    return "Purchase limits are invalid.";
  }

  if (state.supplyTotal < state.maxPurchase) {
    return "Supply total must cover max purchase.";
  }

  return undefined;
}

export function getPricingTierInputError(input: {
  minQuantity: number;
  discountPercent: number;
}): string | undefined {
  if (input.minQuantity <= 0 || input.discountPercent < 0) {
    return "Tier values are invalid.";
  }

  return undefined;
}

export function buildPricingTier(input: {
  listingId: string;
  minQuantity: number;
  discountPercent: number;
}): PricingTier {
  return {
    id: `${input.listingId}-tier-${Date.now()}`,
    minQuantity: input.minQuantity,
    discountPercent: input.discountPercent,
  };
}

export function addPricingTierToState(
  state: ProductPricingState,
  tier: PricingTier,
): ProductPricingState {
  return {
    ...state,
    tiers: [...state.tiers, tier],
  };
}

export function removePricingTierFromState(
  state: ProductPricingState,
  tierId: string,
): ProductPricingState {
  return {
    ...state,
    tiers: state.tiers.filter((tier) => tier.id !== tierId),
  };
}
