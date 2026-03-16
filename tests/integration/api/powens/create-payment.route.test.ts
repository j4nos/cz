// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const { generateClient, verifyAccessToken, ensureAmplifyConfigured } = vi.hoisted(() => ({
  generateClient: vi.fn(),
  verifyAccessToken: vi.fn(),
  ensureAmplifyConfigured: vi.fn(),
}));
const fetchMock = vi.fn();

vi.mock("aws-amplify/data", () => ({ generateClient }));
vi.mock("@/src/config/amplify", () => ({ ensureAmplifyConfigured }));
vi.mock("@/src/infrastructure/auth/verifyAccessToken", () => ({ verifyAccessToken }));
vi.mock("@/src/config/powensEnv", () => ({
  getPowensEnv: () => ({
    POWENS_DOMAIN: "sandbox",
    POWENS_CLIENT_ID: "client-id",
    POWENS_CLIENT_SECRET: "client-secret",
  }),
}));
vi.mock("@/src/config/runtimeEnv", () => ({ getAppUrlEnv: () => "https://cityzeen.test" }));

import { POST } from "@/app/api/powens/create-payment/route";

const makeRequest = (body: Record<string, unknown>, withBearer = true) =>
  new Request("http://localhost/api/powens/create-payment", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(withBearer ? { authorization: "Bearer token" } : {}),
    },
    body: JSON.stringify(body),
  });

const jsonResponse = (status: number, data: unknown) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => data,
  text: async () => JSON.stringify(data),
});

const textResponse = (status: number, raw: string) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => JSON.parse(raw),
  text: async () => raw,
});

const makeClient = (overrides?: {
  order?: Record<string, unknown> | null;
  listing?: Record<string, unknown> | null;
  asset?: Record<string, unknown> | null;
}) => ({
  models: {
    Order: {
      get: vi.fn().mockResolvedValue({
        data:
          overrides?.order ??
          {
            id: "order-1",
            investorId: "investor-1",
            listingId: "listing-1",
            paymentProvider: "bank-transfer",
            total: 200,
            currency: "EUR",
          },
      }),
      update: vi.fn().mockResolvedValue({ data: { id: "order-1", paymentProviderId: "payment-1" } }),
    },
    Listing: {
      get: vi.fn().mockResolvedValue({ data: overrides?.listing ?? { id: "listing-1", assetId: "asset-1" } }),
    },
    Asset: {
      get: vi.fn().mockResolvedValue({
        data:
          overrides?.asset ??
          { id: "asset-1", beneficiaryIban: "HU12", beneficiaryLabel: "Cityzeen Provider" },
      }),
    },
  },
});

describe("POST /api/powens/create-payment", () => {
  beforeEach(() => {
    verifyAccessToken.mockReset().mockResolvedValue({ sub: "investor-1" });
    generateClient.mockReset().mockReturnValue(makeClient());
    ensureAmplifyConfigured.mockReset();
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  it("returns 401 when the bearer token is missing", async () => {
    const response = await POST(makeRequest({ orderId: "order-1" }, false));

    expect(response.status).toBe(401);
  });

  it("returns 403 when the order belongs to another investor", async () => {
    generateClient.mockReturnValue(makeClient({ order: { id: "order-1", investorId: "other", paymentProvider: "bank-transfer", listingId: "listing-1" } }));

    const response = await POST(makeRequest({ orderId: "order-1" }));

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: "Forbidden." });
  });

  it("returns 400 when the order is not eligible for bank transfer", async () => {
    generateClient.mockReturnValue(makeClient({ order: { id: "order-1", investorId: "investor-1", paymentProvider: "card", listingId: "listing-1" } }));

    const response = await POST(makeRequest({ orderId: "order-1" }));

    expect(response.status).toBe(400);
  });

  it("returns 400 when beneficiary details are missing", async () => {
    generateClient.mockReturnValue(makeClient({ asset: { id: "asset-1", beneficiaryIban: "", beneficiaryLabel: "" } }));

    const response = await POST(makeRequest({ orderId: "order-1" }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Missing beneficiary details." });
  });

  it("returns 502 when Powens token fetch fails", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(500, { error: "token failed" }));

    const response = await POST(makeRequest({ orderId: "order-1" }));

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({ error: "token failed" });
  });

  it("returns 502 when Powens payment creation fails", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, { token: "admin-token" }))
      .mockResolvedValueOnce(textResponse(500, JSON.stringify({ error: "payment failed" })));

    const response = await POST(makeRequest({ orderId: "order-1" }));

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({ error: "payment failed" });
  });

  it("returns redirectUrl and paymentId for successful Powens setup", async () => {
    const client = makeClient();
    generateClient.mockReturnValue(client);
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, { token: "admin-token" }))
      .mockResolvedValueOnce(textResponse(200, JSON.stringify({ id: 987, state: "created" })))
      .mockResolvedValueOnce(textResponse(200, JSON.stringify({ token: "payment-token" })));

    const response = await POST(makeRequest({ orderId: "order-1" }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      redirectUrl:
        "https://sandbox.biapi.pro/2.0/auth/webview/payment?payment_id=987&client_id=client-id&code=payment-token",
      paymentId: "987",
    });
    expect(client.models.Order.update).toHaveBeenCalledWith({
      id: "order-1",
      paymentProviderId: "987",
      paymentProviderStatus: "created",
    });
  });
});