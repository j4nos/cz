import { describe, expect, it } from "vitest";

import {
  mapPowensPaymentStateToOrderStatus,
  PowensPaymentSyncService,
} from "@/src/application/use-cases/powensPaymentSyncService";
import type { InvestmentRepository } from "@/src/domain/repositories/investmentRepository";
import { makeAsset, makeListing, makeOrder, makeProduct, makeUserProfile } from "@/tests/helpers/factories";

class FakeRepository implements InvestmentRepository {
  orderById = makeOrder({ paymentProviderId: "payment-1", status: "pending" });
  orderByPaymentProviderId = makeOrder({ paymentProviderId: "payment-1", status: "pending" });
  product = makeProduct({ remainingSupply: 5 });
  updatedOrder = null as ReturnType<typeof makeOrder> | null;
  updatedProduct = null as ReturnType<typeof makeProduct> | null;

  async createUserProfile(input: ReturnType<typeof makeUserProfile>) { return input; }
  async getUserProfileById() { return makeUserProfile(); }
  async updateUserProfile(input: ReturnType<typeof makeUserProfile>) { return input; }
  async createAsset(input: ReturnType<typeof makeAsset>) { return input; }
  async getAssetById() { return makeAsset(); }
  async updateAsset(input: ReturnType<typeof makeAsset>) { return input; }
  async deleteAsset() {}
  async createListing(input: ReturnType<typeof makeListing>) { return input; }
  async getListingById() { return makeListing(); }
  async deleteListing() {}
  async createProduct(input: ReturnType<typeof makeProduct>) { return input; }
  async getProductById() { return this.product; }
  async updateProduct(input: ReturnType<typeof makeProduct>) { this.updatedProduct = input; return input; }
  async deleteProduct() {}
  async createOrder(input: ReturnType<typeof makeOrder>) { return input; }
  async getOrderById() { return this.orderById; }
  async findOrderByPaymentProviderId() { return this.orderByPaymentProviderId; }
  async getMintRequestById() { return null; }
  async createMintRequestIfMissing() { return { request: null, created: false as const }; }
  async updateMintRequest(input: never) { return input; }
  async updateOrder(input: ReturnType<typeof makeOrder>) { this.updatedOrder = input; return input; }
}

describe("Powens payment state mapping", () => {
  it("maps done, failed and pending families", () => {
    expect(mapPowensPaymentStateToOrderStatus("done")).toBe("paid");
    expect(mapPowensPaymentStateToOrderStatus("rejected")).toBe("failed");
    expect(mapPowensPaymentStateToOrderStatus("cancelled")).toBe("failed");
    expect(mapPowensPaymentStateToOrderStatus("pending")).toBe("pending");
    expect(mapPowensPaymentStateToOrderStatus("accepted")).toBe("pending");
  });
});

describe("PowensPaymentSyncService", () => {
  it("returns null when no order matches the payment provider id", async () => {
    const repository = new FakeRepository();
    repository.orderByPaymentProviderId = null as never;
    const service = new PowensPaymentSyncService(repository);

    await expect(service.syncByPaymentProviderId({ paymentProviderId: "missing", paymentState: "done" })).resolves.toBeNull();
  });

  it("completes pending orders when Powens marks them done", async () => {
    const repository = new FakeRepository();
    repository.orderById = makeOrder({ id: "order-1", productId: "product-1", quantity: 2, status: "pending" });
    const service = new PowensPaymentSyncService(repository);

    const result = await service.syncByOrderId({ orderId: "order-1", paymentState: "done" });

    expect(repository.updatedProduct?.remainingSupply).toBe(3);
    expect(result).toMatchObject({ status: "paid", paymentProviderStatus: "done" });
  });

  it("marks rejected or cancelled payments as failed", async () => {
    const repository = new FakeRepository();
    repository.orderByPaymentProviderId = makeOrder({ status: "pending", paymentProviderId: "payment-1" });
    const service = new PowensPaymentSyncService(repository);

    const result = await service.syncByPaymentProviderId({ paymentProviderId: "payment-1", paymentState: "cancelled" });

    expect(result).toMatchObject({ status: "failed", paymentProviderStatus: "cancelled" });
  });

  it("keeps pending-like states as pending", async () => {
    const repository = new FakeRepository();
    repository.orderByPaymentProviderId = makeOrder({ status: "pending", paymentProviderId: "payment-1" });
    const service = new PowensPaymentSyncService(repository);

    const result = await service.syncByPaymentProviderId({ paymentProviderId: "payment-1", paymentState: "accepted" });

    expect(result).toMatchObject({ status: "pending", paymentProviderStatus: "accepted" });
  });

  it("preserves the existing order status for unknown payment states", async () => {
    const repository = new FakeRepository();
    repository.orderByPaymentProviderId = makeOrder({ status: "paid", paymentProviderId: "payment-1", paymentProviderStatus: "done" });
    const service = new PowensPaymentSyncService(repository);

    const result = await service.syncByPaymentProviderId({ paymentProviderId: "payment-1", paymentState: "mystery" });

    expect(result).toMatchObject({ status: "paid", paymentProviderStatus: "mystery" });
  });
});