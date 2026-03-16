// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createHmac } from "node:crypto";
import { gzipSync } from "node:zlib";

const { syncByPaymentProviderId } = vi.hoisted(() => ({
  syncByPaymentProviderId: vi.fn(),
}));

let webhookSecret = "";
let nodeEnv = "test";

vi.mock("@/src/config/powensEnv", () => ({
  getPowensWebhookSecret: () => webhookSecret,
}));

vi.mock("@/src/config/runtimeEnv", () => ({
  getNodeEnv: () => nodeEnv,
}));

vi.mock("@/src/application/use-cases/powensPaymentSyncService", () => ({
  PowensPaymentSyncService: class {
    syncByPaymentProviderId = syncByPaymentProviderId;
  },
}));

vi.mock("@/src/infrastructure/repositories/amplifyInvestmentRepository", () => ({
  AmplifyInvestmentRepository: class {},
}));

import { POST } from "@/app/api/powens/webhook/route";

const makeSignature = (signatureDate: string, rawBody: string) =>
  createHmac("sha256", webhookSecret)
    .update(`POST./api/powens/webhook.${signatureDate}.${rawBody}`)
    .digest("base64");

const makeRequest = (rawBody: string, init?: { signatureDate?: string; signature?: string; gzip?: boolean }) => {
  const body = init?.gzip ? gzipSync(Buffer.from(rawBody)) : rawBody;
  const headers = new Headers();
  if (init?.signatureDate) headers.set("bi-signature-date", init.signatureDate);
  if (init?.signature) headers.set("bi-signature", init.signature);
  if (init?.gzip) headers.set("content-encoding", "gzip");
  return new Request("http://localhost/api/powens/webhook", {
    method: "POST",
    headers,
    body,
  });
};

describe("POST /api/powens/webhook", () => {
  beforeEach(() => {
    webhookSecret = "secret";
    nodeEnv = "test";
    syncByPaymentProviderId.mockReset();
    vi.restoreAllMocks();
    vi.spyOn(Date, "now").mockReturnValue(new Date("2026-03-16T12:00:00.000Z").getTime());
  });

  it("returns 401 when signature headers are missing", async () => {
    const response = await POST(makeRequest(JSON.stringify({ id: 1, state: "done" })));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Missing signature headers." });
  });

  it("returns 401 when the signature date is stale", async () => {
    const signatureDate = "2026-03-16T11:40:00.000Z";
    const rawBody = JSON.stringify({ id: 1, state: "done" });
    const response = await POST(
      makeRequest(rawBody, {
        signatureDate,
        signature: makeSignature(signatureDate, rawBody),
      }),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Stale signature." });
  });

  it("returns 401 when the signature is invalid", async () => {
    const rawBody = JSON.stringify({ id: 1, state: "done" });
    const response = await POST(
      makeRequest(rawBody, {
        signatureDate: "2026-03-16T12:00:00.000Z",
        signature: "invalid",
      }),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Invalid signature." });
  });

  it("returns 202 received true for invalid json payloads", async () => {
    const rawBody = "{invalid";
    const signatureDate = "2026-03-16T12:00:00.000Z";
    const response = await POST(
      makeRequest(rawBody, {
        signatureDate,
        signature: makeSignature(signatureDate, rawBody),
      }),
    );

    expect(response.status).toBe(202);
    await expect(response.json()).resolves.toEqual({ received: true });
  });

  it("returns 202 for unknown payments", async () => {
    syncByPaymentProviderId.mockResolvedValue(null);
    const rawBody = JSON.stringify({ id: 123, state: "done" });
    const signatureDate = "2026-03-16T12:00:00.000Z";

    const response = await POST(
      makeRequest(rawBody, {
        signatureDate,
        signature: makeSignature(signatureDate, rawBody),
        gzip: true,
      }),
    );

    expect(syncByPaymentProviderId).toHaveBeenCalledWith({ paymentProviderId: "123", paymentState: "done" });
    expect(response.status).toBe(202);
    await expect(response.json()).resolves.toEqual({ received: true });
  });

  it("returns 200 for known payments", async () => {
    syncByPaymentProviderId.mockResolvedValue({ id: "order-1", status: "paid" });
    const rawBody = JSON.stringify({ id: 123, state: "done" });
    const signatureDate = "2026-03-16T12:00:00.000Z";

    const response = await POST(
      makeRequest(rawBody, {
        signatureDate,
        signature: makeSignature(signatureDate, rawBody),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ received: true });
  });
});