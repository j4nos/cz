// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const { generateClient, verifyAccessToken, ensureAmplifyConfigured, syncByOrderId } = vi.hoisted(() => ({
  generateClient: vi.fn(),
  verifyAccessToken: vi.fn(),
  ensureAmplifyConfigured: vi.fn(),
  syncByOrderId: vi.fn(),
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
vi.mock("@/src/application/use-cases/powensPaymentSyncService", () => ({
  PowensPaymentSyncService: class {
    syncByOrderId = syncByOrderId;
  },
}));
vi.mock("@/src/infrastructure/repositories/amplifyInvestmentRepository", () => ({
  AmplifyInvestmentRepository: class {},
}));

import { POST } from "@/app/api/powens/payment-status/route";

const makeRequest = (body: Record<string, unknown>, withBearer = true) =>
  new Request("http://localhost/api/powens/payment-status", {
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
});

const makeClient = (order?: Record<string, unknown> | null) => ({
  models: {
    Order: {
      get: vi.fn().mockResolvedValue({
        data:
          order ??
          { id: "order-1", investorId: "investor-1", paymentProviderId: "payment-1", status: "pending" },
      }),
    },
  },
});

describe("POST /api/powens/payment-status", () => {
  beforeEach(() => {
    verifyAccessToken.mockReset().mockResolvedValue({ sub: "investor-1" });
    generateClient.mockReset().mockReturnValue(makeClient());
    ensureAmplifyConfigured.mockReset();
    fetchMock.mockReset();
    syncByOrderId.mockReset().mockResolvedValue({ id: "order-1", status: "paid" });
    vi.stubGlobal("fetch", fetchMock);
  });

  it("returns 401 when bearer token is missing", async () => {
    const response = await POST(makeRequest({ orderId: "order-1" }, false));
    expect(response.status).toBe(401);
  });

  it("returns 403 when the order belongs to another investor", async () => {
    generateClient.mockReturnValue(makeClient({ id: "order-1", investorId: "other", paymentProviderId: "payment-1", status: "pending" }));
    const response = await POST(makeRequest({ orderId: "order-1" }));
    expect(response.status).toBe(403);
  });

  it("returns 400 when paymentProviderId is missing", async () => {
    generateClient.mockReturnValue(makeClient({ id: "order-1", investorId: "investor-1", paymentProviderId: "", status: "pending" }));
    const response = await POST(makeRequest({ orderId: "order-1" }));
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Order missing payment provider id." });
  });

  it("returns 502 when Powens payment fetch fails", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { token: "admin-token" })).mockResolvedValueOnce(jsonResponse(500, { error: "powens failed" }));
    const response = await POST(makeRequest({ orderId: "order-1" }));
    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({ error: "powens failed" });
  });

  it("returns paymentState and orderStatus on success", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { token: "admin-token" })).mockResolvedValueOnce(jsonResponse(200, { state: "done" }));
    const response = await POST(makeRequest({ orderId: "order-1" }));

    expect(syncByOrderId).toHaveBeenCalledWith({ orderId: "order-1", paymentState: "done" });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ paymentState: "done", orderStatus: "paid" });
  });
});