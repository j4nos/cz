"use client";

import { useEffect, useState } from "react";

import type { CouponPreview } from "@/src/application/dto/couponPreview";

type UseCouponPreviewInput = {
  productId?: string;
  unitPrice?: number;
  quantity: number;
  coupon: string;
  debounceMs?: number;
};

export function useCouponPreview({
  productId,
  unitPrice = 0,
  quantity,
  coupon,
  debounceMs = 250,
}: UseCouponPreviewInput) {
  const [couponPreview, setCouponPreview] = useState<CouponPreview | null>(null);

  useEffect(() => {
    if (!productId) {
      setCouponPreview(null);
      return;
    }

    const normalizedCoupon = coupon.trim();
    if (!normalizedCoupon) {
      setCouponPreview(null);
      return;
    }

    const previewQuantity = quantity > 0 ? quantity : 1;
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      void (async () => {
        const response = await fetch("/api/coupons/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId,
            coupon: normalizedCoupon,
            quantity: previewQuantity,
          }),
          signal: controller.signal,
        });
        const payload = (await response.json()) as CouponPreview & {
          error?: string;
        };
        if (!response.ok) {
          throw new Error(payload.error || "Failed to preview coupon.");
        }
        if (!controller.signal.aborted) {
          setCouponPreview(payload);
        }
      })().catch((error) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          if (!controller.signal.aborted) {
            setCouponPreview({
              baseUnitPrice: unitPrice,
              effectiveUnitPrice: unitPrice,
              total: unitPrice * previewQuantity,
              isCouponValid: false,
              hasCouponInput: true,
              message:
                error instanceof Error
                  ? error.message
                  : "Failed to preview coupon.",
            });
          }
        }
      });
    }, debounceMs);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [coupon, debounceMs, productId, quantity, unitPrice]);

  return couponPreview;
}
