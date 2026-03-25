import { describe, expect, it } from "vitest";

import {
  getCouponPricing,
  normalizeCouponCode,
  sanitizeProductCoupons,
  stripProductCoupons,
} from "@/src/domain/policies/productCouponPolicy";
import { makeProduct } from "@/tests/helpers/factories";

describe("productCouponPolicy", () => {
  it("normalizes coupon codes", () => {
    expect(normalizeCouponCode(" vip50 ")).toBe("VIP50");
  });

  it("sanitizes and deduplicates product coupons", () => {
    expect(
      sanitizeProductCoupons([
        { code: " vip50 ", discountedUnitPrice: 80 },
        { code: "VIP50", discountedUnitPrice: 70 },
        { code: "", discountedUnitPrice: 50 },
        { code: "bad", discountedUnitPrice: -1 },
        null,
      ]),
    ).toEqual([{ code: "VIP50", discountedUnitPrice: 80 }]);
  });

  it("calculates pricing from a valid coupon", () => {
    const product = makeProduct({
      unitPrice: 100,
      coupons: [{ code: "VIP50", discountedUnitPrice: 80 }],
    });

    expect(getCouponPricing(product, "vip50")).toMatchObject({
      baseUnitPrice: 100,
      effectiveUnitPrice: 80,
      couponCodeApplied: "VIP50",
      isCouponValid: true,
      hasCouponInput: true,
      discountPctApplied: 20,
    });
  });

  it("removes coupons when stripping public product data", () => {
    const product = makeProduct({
      coupons: [{ code: "VIP50", discountedUnitPrice: 80 }],
    });

    expect(stripProductCoupons(product).coupons).toEqual([]);
  });
});
