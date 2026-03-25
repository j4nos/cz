import { describe, expect, it, vi } from "vitest";

import { RequestPowensPaymentService } from "@/src/application/use-cases/requestPowensPaymentService";
import { makeAsset, makeListing, makeOrder } from "@/tests/helpers/factories";

describe("RequestPowensPaymentService", () => {
  const config = {
    appUrl: "https://cityzeen.test",
    powensBaseUrl: "https://sandbox.biapi.pro/2.0",
    powensClientId: "client-id",
  };

  it("returns 404 when the order is missing", async () => {
    const service = new RequestPowensPaymentService(
      {
        getOrderById: vi.fn().mockResolvedValue(null),
        getListingById: vi.fn(),
        getAssetById: vi.fn(),
        updateOrder: vi.fn(),
      },
      {
        getAdminToken: vi.fn(),
        createPayment: vi.fn(),
        getPaymentScopedToken: vi.fn(),
      },
      config,
    );

    await expect(service.createPayment({ orderId: "order-1", userId: "investor-1" })).resolves.toEqual({
      status: 404,
      body: { error: "Order not found." },
    });
  });

  it("returns 400 when beneficiary data is missing", async () => {
    const service = new RequestPowensPaymentService(
      {
        getOrderById: vi.fn().mockResolvedValue(makeOrder({ paymentProvider: "bank-transfer" })),
        getListingById: vi.fn().mockResolvedValue(makeListing()),
        getAssetById: vi.fn().mockResolvedValue(makeAsset({ beneficiaryIban: "", beneficiaryLabel: "" })),
        updateOrder: vi.fn(),
      },
      {
        getAdminToken: vi.fn(),
        createPayment: vi.fn(),
        getPaymentScopedToken: vi.fn(),
      },
      config,
    );

    await expect(service.createPayment({ orderId: "order-1", userId: "investor-1" })).resolves.toEqual({
      status: 400,
      body: { error: "Missing beneficiary details." },
    });
  });

  it("returns 502 when admin token fetch fails", async () => {
    const service = new RequestPowensPaymentService(
      {
        getOrderById: vi.fn().mockResolvedValue(makeOrder({ paymentProvider: "bank-transfer" })),
        getListingById: vi.fn().mockResolvedValue(makeListing()),
        getAssetById: vi.fn().mockResolvedValue(makeAsset({ beneficiaryIban: "HU12", beneficiaryLabel: "Provider" })),
        updateOrder: vi.fn(),
      },
      {
        getAdminToken: vi.fn().mockRejectedValue(new Error("token failed")),
        createPayment: vi.fn(),
        getPaymentScopedToken: vi.fn(),
      },
      config,
    );

    await expect(service.createPayment({ orderId: "order-1", userId: "investor-1" })).resolves.toEqual({
      status: 502,
      body: { error: "token failed" },
    });
  });

  it("returns redirectUrl and paymentId on success", async () => {
    const updateOrder = vi.fn();
    const service = new RequestPowensPaymentService(
      {
        getOrderById: vi.fn().mockResolvedValue(makeOrder({ paymentProvider: "bank-transfer" })),
        getListingById: vi.fn().mockResolvedValue(makeListing()),
        getAssetById: vi.fn().mockResolvedValue(makeAsset({ beneficiaryIban: "HU12", beneficiaryLabel: "Provider" })),
        updateOrder,
      },
      {
        getAdminToken: vi.fn().mockResolvedValue("admin-token"),
        createPayment: vi.fn().mockResolvedValue({ paymentId: "987", paymentState: "created" }),
        getPaymentScopedToken: vi.fn().mockResolvedValue("payment-token"),
      },
      config,
    );

    const result = await service.createPayment({ orderId: "order-1", userId: "investor-1" });

    expect(updateOrder).toHaveBeenCalledWith({
      id: "order-1",
      paymentProviderId: "987",
      paymentProviderStatus: "created",
    });
    expect(result).toEqual({
      status: 200,
      body: {
        redirectUrl: "https://sandbox.biapi.pro/2.0/auth/webview/payment?payment_id=987&client_id=client-id&code=payment-token",
        paymentId: "987",
      },
    });
  });
});
