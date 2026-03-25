import { NextResponse } from "next/server";

import { verifyAccessToken } from "@/src/infrastructure/auth/verifyAccessToken";
import { createPowensPaymentStatusService } from "@/src/infrastructure/composition/defaults";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length).trim()
      : "";
    if (!token) {
      return NextResponse.json({ error: "Missing bearer token." }, { status: 401 });
    }

    const payload = await verifyAccessToken(token);
    const userId = payload.sub as string | undefined;
    if (!userId) {
      return NextResponse.json({ error: "Invalid token." }, { status: 401 });
    }

    const { orderId } = (await request.json()) as { orderId?: string };
    const cleanedOrderId = typeof orderId === "string" ? orderId.trim() : "";
    if (!cleanedOrderId) {
      return NextResponse.json({ error: "Missing orderId." }, { status: 400 });
    }

    const result = await createPowensPaymentStatusService(token).fetchStatus({
      orderId: cleanedOrderId,
      userId,
    });

    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    console.error("[powens] payment-status failed", error);
    return NextResponse.json(
      { error: "Failed to fetch payment status." },
      { status: 500 },
    );
  }
}
