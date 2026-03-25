import { NextResponse } from "next/server";

import { createCouponPreviewService } from "@/src/infrastructure/composition/defaults";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      productId?: string;
      coupon?: string;
      quantity?: number;
    };

    const productId = body.productId?.trim();
    if (!productId) {
      return NextResponse.json({ error: "productId is required." }, { status: 400 });
    }

    const result = await createCouponPreviewService().preview({
      productId,
      coupon: body.coupon,
      quantity: body.quantity,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "Product not found." ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
