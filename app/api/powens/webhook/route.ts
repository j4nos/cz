import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { gunzipSync } from "zlib";
import { generateClient } from "aws-amplify/data";

import type { Schema } from "@/amplify/data/resource";
import { ensureAmplifyConfigured } from "@/src/infrastructure/amplify/config";
import { listAll } from "@/src/infrastructure/amplify/pagination";
import { getPowensWebhookSecret } from "@/src/infrastructure/config/powensEnv";
import { getNodeEnv } from "@/src/infrastructure/config/runtimeEnv";

export const runtime = "nodejs";

const getClient = () => {
  ensureAmplifyConfigured();
  return generateClient<Schema>();
};

type PowensPaymentWebhook = {
  id?: number | string;
  state?: string;
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

const readRawBody = async (request: Request) => {
  const buffer = Buffer.from(await request.arrayBuffer());
  const encoding = (request.headers.get("content-encoding") || "").toLowerCase();
  if (encoding.includes("gzip")) {
    return gunzipSync(buffer).toString("utf-8");
  }
  return buffer.toString("utf-8");
};

const MAX_SIGNATURE_AGE_MS = 5 * 60 * 1000;

const isSignatureDateFresh = (signatureDate: string) => {
  const trimmed = signatureDate.trim();
  let timestamp = Date.parse(trimmed);
  if (Number.isNaN(timestamp)) {
    const numeric = Number(trimmed);
    if (!Number.isFinite(numeric)) {
      return false;
    }
    timestamp = numeric < 1e12 ? numeric * 1000 : numeric;
  }
  const now = Date.now();
  return Math.abs(now - timestamp) <= MAX_SIGNATURE_AGE_MS;
};

const timingSafeEqualBase64 = (expected: string, actual: string) => {
  const expectedBuffer = Buffer.from(expected, "utf-8");
  const actualBuffer = Buffer.from(actual, "utf-8");
  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }
  return timingSafeEqual(expectedBuffer, actualBuffer);
};

export async function POST(request: Request) {
  try {
    const payloadRaw = await readRawBody(request);
    const secret = getPowensWebhookSecret();
    const nodeEnv = getNodeEnv();

    if (!secret) {
      if (nodeEnv === "production") {
        console.error("[powens] webhook secret missing in production");
        return NextResponse.json({ error: "Webhook misconfigured." }, { status: 500 });
      }
    } else {
      const signature = request.headers.get("bi-signature") || "";
      const signatureDate = request.headers.get("bi-signature-date") || "";
      if (!signature || !signatureDate) {
        return NextResponse.json({ error: "Missing signature headers." }, { status: 401 });
      }
      if (!isSignatureDateFresh(signatureDate)) {
        return NextResponse.json({ error: "Stale signature." }, { status: 401 });
      }

      const pathname = new URL(request.url).pathname;
      const signaturePayload = `${request.method}.${pathname}.${signatureDate}.${payloadRaw}`;
      const expected = createHmac("sha256", secret)
        .update(signaturePayload)
        .digest("base64");
      if (!timingSafeEqualBase64(expected, signature)) {
        return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
      }
    }

    let payload: PowensPaymentWebhook | null = null;
    try {
      payload = JSON.parse(payloadRaw) as PowensPaymentWebhook;
    } catch (error) {
      console.warn("[powens] webhook invalid json", error);
    }

    if (!payload?.id) {
      return NextResponse.json({ received: true }, { status: 202 });
    }

    const paymentId = String(payload.id);
    const client = getClient();
    const matches = await listAll<Schema["Order"]["type"], { nextToken?: string }>((args) =>
      client.models.Order.list({
        filter: { paymentProviderId: { eq: paymentId } },
        ...(args ?? {}),
      }),
    );
    const order = matches[0];
    if (!order) {
      return NextResponse.json({ received: true }, { status: 202 });
    }

    const nextStatus = mapPaymentStateToOrderStatus(payload.state);
    await client.models.Order.update({
      id: order.id,
      status: nextStatus ?? order.status ?? "pending",
      paymentProviderStatus: payload.state ?? order.paymentProviderStatus ?? "",
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[powens] webhook failed", error);
    return NextResponse.json({ error: "Webhook failed." }, { status: 500 });
  }
}
