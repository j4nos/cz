import { NextResponse } from "next/server";
import { generateClient } from "aws-amplify/data";

import type { Schema } from "@/amplify/data/resource";
import { ensureAmplifyConfigured } from "@/src/infrastructure/amplify/config";
import { verifyAccessToken } from "@/src/infrastructure/auth/verifyAccessToken";
import { getPowensEnv } from "@/src/infrastructure/config/powensEnv";

export const runtime = "nodejs";

const getClient = () => {
  ensureAmplifyConfigured();
  return generateClient<Schema>();
};

const normalizeBaseUrl = (value: string) => value.replace(/\/+$/, "");

const getPowensBaseUrl = (domain: string) =>
  domain ? `https://${domain}.biapi.pro/2.0` : "";

type PowensPaymentResponse = {
  id?: number | string;
  state?: string;
  error?: string;
  message?: string;
};

const normalizeState = (state?: string) => (state || "").toLowerCase();

const mapPaymentStateToOrderStatus = (state?: string) => {
  switch (normalizeState(state)) {
    case "done":
      return "paid";
    case "rejected":
    case "cancelled":
    case "canceled":
      return "failed";
    case "created":
    case "pending":
    case "accepted":
    case "validating":
      return "pending";
    default:
      return undefined;
  }
};

const getPowensTokenUrl = (baseUrl: string) =>
  normalizeBaseUrl(`${baseUrl}/auth/token`);

const getPowensAccessToken = async (baseUrl: string) => {
  const { POWENS_CLIENT_ID: clientId, POWENS_CLIENT_SECRET: clientSecret } =
    getPowensEnv();
  const tokenUrl = getPowensTokenUrl(baseUrl);
  const body = JSON.stringify({
    scope: "payments:admin",
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
  });
  const tokenRes = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
  const tokenData = (await tokenRes.json()) as {
    token?: string;
    access_token?: string;
    error?: string;
    message?: string;
  };
  const accessToken = tokenData.token || tokenData.access_token || "";
  if (!tokenRes.ok || !accessToken) {
    throw new Error(
      tokenData.error || tokenData.message || "Failed to fetch access token.",
    );
  }
  return accessToken;
};

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

    const client = getClient();
    const orderRes = await client.models.Order.get({ id: cleanedOrderId });
    const order = orderRes.data;
    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }
    if (order.investorId !== userId) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }
    if (!order.paymentProviderId) {
      return NextResponse.json(
        { error: "Order missing payment provider id." },
        { status: 400 },
      );
    }

    const { POWENS_DOMAIN: powensDomain } = getPowensEnv();
    const powensBaseUrl = getPowensBaseUrl(powensDomain);
    const powensToken = await getPowensAccessToken(powensBaseUrl);

    const paymentRes = await fetch(
      `${powensBaseUrl}/payments/${order.paymentProviderId}`,
      {
        headers: { Authorization: `Bearer ${powensToken}` },
      },
    );
    const paymentData = (await paymentRes.json()) as PowensPaymentResponse;
    if (!paymentRes.ok) {
      return NextResponse.json(
        {
          error:
            paymentData.error ||
            paymentData.message ||
            "Failed to fetch payment.",
        },
        { status: 502 },
      );
    }

    const nextStatus = mapPaymentStateToOrderStatus(paymentData.state);
    await client.models.Order.update({
      id: order.id,
      status: nextStatus ?? order.status ?? "pending",
      paymentProviderStatus: paymentData.state ?? order.paymentProviderStatus ?? "",
    });

    return NextResponse.json({
      paymentState: paymentData.state ?? "",
      orderStatus: nextStatus ?? order.status ?? "pending",
    });
  } catch (error) {
    console.error("[powens] payment-status failed", error);
    return NextResponse.json(
      { error: "Failed to fetch payment status." },
      { status: 500 },
    );
  }
}
