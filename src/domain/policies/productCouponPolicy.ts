import type { Product, ProductCoupon } from "@/src/domain/entities";

export function normalizeCouponCode(value?: string) {
  return (value ?? "").trim().toUpperCase();
}

export function sanitizeProductCoupons(coupons: Array<Partial<ProductCoupon> | null | undefined>) {
  const seen = new Set<string>();

  return coupons
    .filter((coupon): coupon is Partial<ProductCoupon> => Boolean(coupon))
    .map((coupon) => ({
      code: normalizeCouponCode(coupon.code),
      discountedUnitPrice: Number(coupon.discountedUnitPrice),
    }))
    .filter((coupon) => {
      if (!coupon.code || !Number.isFinite(coupon.discountedUnitPrice) || coupon.discountedUnitPrice < 0) {
        return false;
      }
      if (seen.has(coupon.code)) {
        return false;
      }
      seen.add(coupon.code);
      return true;
    });
}

export function findProductCoupon(product: Pick<Product, "coupons"> | null, couponCode?: string) {
  const normalizedCode = normalizeCouponCode(couponCode);
  if (!normalizedCode) {
    return null;
  }

  return product?.coupons.find((coupon) => normalizeCouponCode(coupon.code) === normalizedCode) ?? null;
}

export function getCouponPricing(product: Pick<Product, "unitPrice" | "coupons"> | null, couponCode?: string) {
  const baseUnitPrice = Number(product?.unitPrice ?? 0);
  const coupon = findProductCoupon(product, couponCode);
  const effectiveUnitPrice = coupon ? coupon.discountedUnitPrice : baseUnitPrice;
  const normalizedCoupon = normalizeCouponCode(couponCode);
  const discountPctApplied =
    coupon && baseUnitPrice > 0
      ? Number((((baseUnitPrice - effectiveUnitPrice) / baseUnitPrice) * 100).toFixed(2))
      : undefined;

  return {
    baseUnitPrice,
    effectiveUnitPrice,
    coupon,
    couponCodeApplied: coupon ? normalizeCouponCode(coupon.code) : undefined,
    isCouponValid: Boolean(coupon),
    hasCouponInput: Boolean(normalizedCoupon),
    discountPctApplied,
  };
}

export function stripProductCoupons<T extends Product>(product: T): T {
  return {
    ...product,
    coupons: [],
  };
}
