// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const { verifyAccessToken, fetchStatus } = vi.hoisted(() => ({
  verifyAccessToken: vi.fn(),
  fetchStatus: vi.fn(),
}));

vi.mock("@/src/infrastructure/auth/verifyAccessToken", () => ({ verifyAccessToken }));
vi.mock("@/src/infrastructure/composition/defaults", () => ({
  createPowensPaymentStatusService: () => ({
    fetchStatus,
  }),
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

describe("POST /api/powens/payment-status", () => {
  beforeEach(() => {
    verifyAccessToken.mockReset().mockResolvedValue({ sub: "investor-1" });
    fetchStatus.mockReset().mockResolvedValue({
      status: 200,
      body: { paymentState: "done", orderStatus: "paid" },
    });
  });

  it("returns 401 when bearer token is missing", async () => {
    const response = await POST(makeRequest({ orderId: "order-1" }, false));
    expect(response.status).toBe(401);
  });

  it("returns 403 when the order belongs to another investor", async () => {
    fetchStatus.mockResolvedValue({ status: 403, body: { error: "Forbidden." } });
    const response = await POST(makeRequest({ orderId: "order-1" }));
    expect(response.status).toBe(403);
  });

  it("returns 400 when paymentProviderId is missing", async () => {
    fetchStatus.mockResolvedValue({ status: 400, body: { error: "Order missing payment provider id." } });
    const response = await POST(makeRequest({ orderId: "order-1" }));
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Order missing payment provider id." });
  });

  it("returns 502 when Powens payment fetch fails", async () => {
    fetchStatus.mockResolvedValue({ status: 502, body: { error: "powens failed" } });
    const response = await POST(makeRequest({ orderId: "order-1" }));
    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({ error: "powens failed" });
  });

  it("returns paymentState and orderStatus on success", async () => {
    const response = await POST(makeRequest({ orderId: "order-1" }));

    expect(fetchStatus).toHaveBeenCalledWith({ orderId: "order-1", userId: "investor-1" });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ paymentState: "done", orderStatus: "paid" });
  });
});
