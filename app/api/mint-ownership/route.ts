import { generateClient } from "aws-amplify/data";
import { ethers } from "ethers";
import { NextResponse } from "next/server";

import type { Schema } from "@/amplify/data/resource";
import { verifyAccessToken } from "@/src/infrastructure/auth/verifyAccessToken";
import { ensureAmplifyConfigured } from "@/src/infrastructure/amplify/config";

export const runtime = "nodejs";

const getClient = () => {
  ensureAmplifyConfigured();
  return generateClient<Schema>();
};

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

    const client = getClient();
    const orderRes = await client.models.Order.get({ id: cleanedOrderId });
    const order = orderRes.data;
    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }
    if (order.status !== "paid") {
      return NextResponse.json(
        { error: "Order is not eligible for minting." },
        { status: 409 }
      );
    }
    if (order.requiresProviderConfirmation && !order.providerConfirmedAt) {
      return NextResponse.json(
        { error: "Order requires provider confirmation." },
        { status: 409 }
      );
    }
    const isInvestor = order.investorId === userId;
    const isProvider = order.providerUserId === userId;
    if (!isInvestor && !isProvider) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const resolvedWallet =
      typeof walletAddress === "string"
        ? walletAddress.trim()
        : typeof to === "string"
          ? to.trim()
          : "";
    if (!order.investorWalletAddress) {
      if (!resolvedWallet) {
        return NextResponse.json(
          { error: "Missing investor wallet address." },
          { status: 400 }
        );
      }
      if (!ethers.isAddress(resolvedWallet)) {
        return NextResponse.json(
          { error: "Invalid investor wallet address." },
          { status: 400 }
        );
      }
      await client.models.Order.update({
        id: order.id,
        investorWalletAddress: resolvedWallet,
      });
      order.investorWalletAddress = resolvedWallet;
    }

    if (order.mintedAt) {
      return NextResponse.json({
        status: "minted",
        mintedAt: order.mintedAt,
      });
    }

    if (order.mintRequestedAt) {
      return NextResponse.json(
        {
          status: "pending",
          mintRequestedAt: order.mintRequestedAt,
        },
        { status: 202 }
      );
    }

    const now = new Date().toISOString();
    await client.models.Order.update({
      id: order.id,
      mintRequestedAt: now,
    });

    return NextResponse.json(
      { status: "queued", mintRequestedAt: now },
      { status: 202 }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to mint tokens.";
    console.error("mint-ownership error", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
