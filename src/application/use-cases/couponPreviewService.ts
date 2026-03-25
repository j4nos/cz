import type { CouponPreview } from "@/src/application/dto/couponPreview";
import { getCouponPricing, normalizeCouponCode } from "@/src/domain/policies/productCouponPolicy";
import type { Product } from "@/src/domain/entities";

type CouponPreviewRepository = {
  getProductById(productId: string): Promise<Product | null>;
};

export class CouponPreviewService {
  constructor(private readonly repository: CouponPreviewRepository) {}

  async preview(input: {
    productId: string;
    coupon?: string;
    quantity?: number;
  }): Promise<CouponPreview> {
    const product = await this.repository.getProductById(input.productId);
    if (!product) {
      throw new Error("Product not found.");
    }

    const quantity =
      typeof input.quantity === "number" && Number.isFinite(input.quantity) && input.quantity > 0
        ? input.quantity
        : 1;
    const coupon = input.coupon?.trim() ?? "";
    const pricing = getCouponPricing(product, coupon);
    const normalizedCoupon = normalizeCouponCode(coupon);

    return {
      baseUnitPrice: pricing.baseUnitPrice,
      effectiveUnitPrice: pricing.effectiveUnitPrice,
      total: pricing.effectiveUnitPrice * quantity,
      couponCodeApplied: pricing.couponCodeApplied,
      discountPctApplied: pricing.discountPctApplied,
      isCouponValid: pricing.isCouponValid,
      hasCouponInput: Boolean(normalizedCoupon),
      message:
        normalizedCoupon && !pricing.isCouponValid
          ? "Coupon code not found for this product."
          : undefined,
    };
  }
}
