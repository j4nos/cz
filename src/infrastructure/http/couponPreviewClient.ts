"use client";

import type { CouponPreview } from "@/src/application/dto/couponPreview";

export async function previewCoupon(input: {
  productId: string;
  coupon: string;
  quantity: number;
  signal?: AbortSignal;
}) {
  const response = await fetch("/api/coupons/preview", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      productId: input.productId,
      coupon: input.coupon,
      quantity: input.quantity,
    }),
    signal: input.signal,
  });

  const payload = (await response.json()) as CouponPreview & {
    error?: string;
  };
  if (!response.ok) {
    throw new Error(payload.error || "Failed to preview coupon.");
  }

  return payload;
}
