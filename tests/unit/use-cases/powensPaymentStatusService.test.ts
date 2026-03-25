import { describe, expect, it, vi } from "vitest";

import { PowensPaymentStatusService } from "@/src/application/use-cases/powensPaymentStatusService";
import { makeOrder } from "@/tests/helpers/factories";

describe("PowensPaymentStatusService", () => {
  it("returns 404 when the order is missing", async () => {
    const service = new PowensPaymentStatusService(
      { getOrderById: vi.fn().mockResolvedValue(null) },
      { syncByOrderId: vi.fn() },
      { getAdminToken: vi.fn(), getPaymentState: vi.fn() },
    );

    await expect(service.fetchStatus({ orderId: "order-1", userId: "investor-1" })).resolves.toEqual({
      status: 404,
      body: { error: "Order not found." },
    });
  });

  it("returns 400 when paymentProviderId is missing", async () => {
    const service = new PowensPaymentStatusService(
      { getOrderById: vi.fn().mockResolvedValue(makeOrder({ paymentProviderId: undefined })) },
      { syncByOrderId: vi.fn() },
      { getAdminToken: vi.fn(), getPaymentState: vi.fn() },
    );

    await expect(service.fetchStatus({ orderId: "order-1", userId: "investor-1" })).resolves.toEqual({
      status: 400,
      body: { error: "Order missing payment provider id." },
    });
  });

  it("returns 502 when fetching the payment state fails", async () => {
    const service = new PowensPaymentStatusService(
      { getOrderById: vi.fn().mockResolvedValue(makeOrder({ paymentProviderId: "payment-1" })) },
      { syncByOrderId: vi.fn() },
      {
        getAdminToken: vi.fn().mockResolvedValue("admin-token"),
        getPaymentState: vi.fn().mockRejectedValue(new Error("powens failed")),
      },
    );

    await expect(service.fetchStatus({ orderId: "order-1", userId: "investor-1" })).resolves.toEqual({
      status: 502,
      body: { error: "powens failed" },
    });
  });

  it("syncs the order and returns the current payment state", async () => {
    const syncByOrderId = vi.fn().mockResolvedValue(makeOrder({ status: "paid" }));
    const service = new PowensPaymentStatusService(
      { getOrderById: vi.fn().mockResolvedValue(makeOrder({ paymentProviderId: "payment-1", status: "pending" })) },
      { syncByOrderId },
      {
        getAdminToken: vi.fn().mockResolvedValue("admin-token"),
        getPaymentState: vi.fn().mockResolvedValue("done"),
      },
    );

    const result = await service.fetchStatus({ orderId: "order-1", userId: "investor-1" });
    expect(syncByOrderId).toHaveBeenCalledWith({ orderId: "order-1", paymentState: "done" });
    expect(result).toEqual({
      status: 200,
      body: { paymentState: "done", orderStatus: "paid" },
    });
  });
});
