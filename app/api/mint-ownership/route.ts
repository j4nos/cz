import { NextResponse } from "next/server";

import { verifyAccessToken } from "@/src/infrastructure/auth/verifyAccessToken";
import { createRequestOwnershipMintingService } from "@/src/infrastructure/composition/defaults";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { orderId, walletAddress, to } = (await request.json()) as {
      orderId?: string;
      walletAddress?: string;
      to?: string;
    };
    const authHeader = request.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length).trim()
      : "";
    if (!token) {
      return NextResponse.json({ error: "Missing bearer token." }, { status: 401 });
    }

    const cleanedOrderId = typeof orderId === "string" ? orderId.trim() : "";
    if (!cleanedOrderId) {
      return NextResponse.json({ error: "Missing orderId." }, { status: 400 });
    }

    const payload = await verifyAccessToken(token);
    const userId = payload.sub as string | undefined;
    if (!userId) {
      return NextResponse.json({ error: "Invalid token." }, { status: 401 });
    }

    const result = await createRequestOwnershipMintingService(token).requestMint({
      orderId: cleanedOrderId,
      userId,
      walletAddress:
        typeof walletAddress === "string"
          ? walletAddress
          : typeof to === "string"
            ? to
            : undefined,
    });

    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to mint tokens.";
    console.error("mint-ownership error", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
