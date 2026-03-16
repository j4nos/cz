import { describe, expect, it, vi } from "vitest";

import { createDefaultPricingState } from "@/src/application/dto/pricingState";
import {
  addPricingTierToState,
  buildPricingTier,
  getPricingStateError,
  getPricingTierInputError,
  removePricingTierFromState,
} from "@/src/application/use-cases/pricingRules";
import { makeProduct } from "@/tests/helpers/factories";

describe("pricingRules", () => {
  it("validates required name, non-negative price, purchase limits and supply totals", () => {
    expect(getPricingStateError({ ...createDefaultPricingState(undefined, "listing-1"), name: "   " })).toBe(
      "Product name is required.",
    );
    expect(getPricingStateError({ ...createDefaultPricingState(undefined, "listing-1"), unitPrice: -1 })).toBe(
      "Unit price must be zero or greater.",
    );
    expect(
      getPricingStateError({ ...createDefaultPricingState(undefined, "listing-1"), minPurchase: 2, maxPurchase: 1 }),
    ).toBe("Purchase limits are invalid.");
    expect(
      getPricingStateError({ ...createDefaultPricingState(undefined, "listing-1"), supplyTotal: 2, maxPurchase: 5 }),
    ).toBe("Supply total must cover max purchase.");
  });

  it("validates tier inputs", () => {
    expect(getPricingTierInputError({ minQuantity: 0, discountPercent: 10 })).toBe("Tier values are invalid.");
    expect(getPricingTierInputError({ minQuantity: 1, discountPercent: -1 })).toBe("Tier values are invalid.");
    expect(getPricingTierInputError({ minQuantity: 1, discountPercent: 0 })).toBeUndefined();
  });

  it("builds pricing tiers with deterministic ids when Date.now is stubbed", () => {
    vi.spyOn(Date, "now").mockReturnValue(12345);

    expect(buildPricingTier({ listingId: "listing-1", minQuantity: 5, discountPercent: 10 })).toEqual({
      id: "listing-1-tier-12345",
      minQuantity: 5,
      discountPercent: 10,
    });
  });

  it("adds tiers immutably", () => {
    const state = createDefaultPricingState(makeProduct(), "listing-1");
    const tier = { id: "tier-2", minQuantity: 10, discountPercent: 5 };

    const next = addPricingTierToState(state, tier);

    expect(next).not.toBe(state);
    expect(next.tiers).toHaveLength(state.tiers.length + 1);
    expect(state.tiers).toHaveLength(1);
    expect(next.name).toBe(state.name);
  });

  it("removes tiers immutably and preserves unrelated fields", () => {
    const state = {
      ...createDefaultPricingState(makeProduct(), "listing-1"),
      tiers: [
        { id: "tier-1", minQuantity: 5, discountPercent: 0 },
        { id: "tier-2", minQuantity: 10, discountPercent: 5 },
      ],
    };

    const next = removePricingTierFromState(state, "tier-1");

    expect(next).not.toBe(state);
    expect(next.tiers).toEqual([{ id: "tier-2", minQuantity: 10, discountPercent: 5 }]);
    expect(next.currency).toBe(state.currency);
  });
});