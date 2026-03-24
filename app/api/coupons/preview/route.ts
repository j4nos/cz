import { NextResponse } from "next/server";

import { getCouponPricing, normalizeCouponCode } from "@/src/application/use-cases/productCoupons";
import { AmplifyInvestmentRepository } from "@/src/infrastructure/repositories/amplifyInvestmentRepository";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      productId?: string;
      coupon?: string;
      quantity?: number;
    };

    const productId = body.productId?.trim();
    const quantity =
      typeof body.quantity === "number" && Number.isFinite(body.quantity) && body.quantity > 0
        ? body.quantity
        : 1;
    const coupon = body.coupon?.trim() ?? "";

    if (!productId) {
      return NextResponse.json({ error: "productId is required." }, { status: 400 });
    }

    const repository = new AmplifyInvestmentRepository(undefined, "apiKey");
    const product = await repository.getProductById(productId);

    if (!product) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    const pricing = getCouponPricing(product, coupon);
    const normalizedCoupon = normalizeCouponCode(coupon);

    return NextResponse.json({
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
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
