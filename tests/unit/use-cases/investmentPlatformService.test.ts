import { describe, expect, it } from "vitest";

import { InvestmentPlatformService } from "@/src/application/use-cases/investmentPlatformService";
import type { InvestmentRepository } from "@/src/domain/repositories/investmentRepository";
import { makeAsset, makeListing, makeOrder, makeProduct, makeUserProfile } from "@/tests/helpers/factories";

class FakeRepository implements InvestmentRepository {
  user = makeUserProfile({ id: "investor-1", investorType: "PRO" });
  asset = makeAsset();
  listing = makeListing();
  product = makeProduct();
  order = makeOrder();
  createdProduct = null as ReturnType<typeof makeProduct> | null;
  createdOrder = null as ReturnType<typeof makeOrder> | null;
  updatedProduct = null as ReturnType<typeof makeProduct> | null;
  updatedOrder = null as ReturnType<typeof makeOrder> | null;

  async createUserProfile(input: ReturnType<typeof makeUserProfile>) { return input; }
  async getUserProfileById() { return this.user; }
  async updateUserProfile(input: ReturnType<typeof makeUserProfile>) { return input; }
  async createAsset(input: ReturnType<typeof makeAsset>) { return input; }
  async getAssetById() { return this.asset; }
  async updateAsset(input: ReturnType<typeof makeAsset>) { return input; }
  async deleteAsset() {}
  async createListing(input: ReturnType<typeof makeListing>) { return input; }
  async getListingById() { return this.listing; }
  async deleteListing() {}
  async createProduct(input: ReturnType<typeof makeProduct>) { this.createdProduct = input; return input; }
  async getProductById() { return this.product; }
  async updateProduct(input: ReturnType<typeof makeProduct>) { this.updatedProduct = input; return input; }
  async deleteProduct() {}
  async createOrder(input: ReturnType<typeof makeOrder>) { this.createdOrder = input; return input; }
  async getOrderById() { return this.order; }
  async findOrderByPaymentProviderId() { return null; }
  async getMintRequestById() { return null; }
  async createMintRequestIfMissing() { return { request: null, created: false as const }; }
  async updateMintRequest(input: never) { return input; }
  async updateOrder(input: ReturnType<typeof makeOrder>) { this.updatedOrder = input; return input; }
}

class FixedIdGenerator {
  next() { return "generated-id"; }
}

class FixedClock {
  now() { return "2026-03-16T00:00:00.000Z"; }
}

describe("InvestmentPlatformService", () => {
  it("rejects invalid purchase limits when creating a product", async () => {
    const repository = new FakeRepository();
    const service = new InvestmentPlatformService(repository, new FixedIdGenerator(), new FixedClock());

    await expect(service.createProduct({
      listingId: "listing-1",
      name: "Fraction",
      currency: "EUR",
      unitPrice: 100,
      minPurchase: 0,
      maxPurchase: 5,
      eligibleInvestorType: "ANY",
      supplyTotal: 100,
    })).rejects.toMatchObject({ message: "Purchase limits are invalid." });

    await expect(service.createProduct({
      listingId: "listing-1",
      name: "Fraction",
      currency: "EUR",
      unitPrice: 100,
      minPurchase: 2,
      maxPurchase: 1,
      eligibleInvestorType: "ANY",
      supplyTotal: 100,
    })).rejects.toMatchObject({ message: "Purchase limits are invalid." });
  });

  it("rejects supply totals that do not cover max purchase", async () => {
    const repository = new FakeRepository();
    const service = new InvestmentPlatformService(repository, new FixedIdGenerator(), new FixedClock());

    await expect(service.createProduct({
      listingId: "listing-1",
      name: "Fraction",
      currency: "EUR",
      unitPrice: 100,
      minPurchase: 1,
      maxPurchase: 10,
      eligibleInvestorType: "ANY",
      supplyTotal: 5,
    })).rejects.toMatchObject({ message: "Supply total must cover max purchase." });
  });

  it("rejects orders for listings that are not open", async () => {
    const repository = new FakeRepository();
    repository.listing = makeListing({ saleStatus: "closed" });
    const service = new InvestmentPlatformService(repository, new FixedIdGenerator(), new FixedClock());

    await expect(service.startOrder({ investorId: "investor-1", listingId: "listing-1", productId: "product-1", quantity: 2 })).rejects.toMatchObject({
      message: "Listing is not open for orders.",
    });
  });

  it("rejects orders for products belonging to another listing", async () => {
    const repository = new FakeRepository();
    repository.product = makeProduct({ listingId: "listing-2" });
    const service = new InvestmentPlatformService(repository, new FixedIdGenerator(), new FixedClock());

    await expect(service.startOrder({ investorId: "investor-1", listingId: "listing-1", productId: "product-1", quantity: 2 })).rejects.toMatchObject({
      message: "Product does not belong to the selected listing.",
    });
  });

  it("rejects quantities outside limits or above remaining supply", async () => {
    const repository = new FakeRepository();
    repository.product = makeProduct({ minPurchase: 2, maxPurchase: 4, remainingSupply: 3 });
    const service = new InvestmentPlatformService(repository, new FixedIdGenerator(), new FixedClock());

    await expect(service.startOrder({ investorId: "investor-1", listingId: "listing-1", productId: "product-1", quantity: 1 })).rejects.toMatchObject({
      message: "Quantity is outside the allowed purchase range.",
    });
    await expect(service.startOrder({ investorId: "investor-1", listingId: "listing-1", productId: "product-1", quantity: 4 })).rejects.toMatchObject({
      message: "Not enough remaining supply.",
    });
  });

  it("rejects ineligible investors", async () => {
    const repository = new FakeRepository();
    repository.user = makeUserProfile({ id: "investor-1", investorType: "RETAIL" });
    repository.product = makeProduct({ eligibleInvestorType: "PRO" });
    const service = new InvestmentPlatformService(repository, new FixedIdGenerator(), new FixedClock());

    await expect(service.startOrder({ investorId: "investor-1", listingId: "listing-1", productId: "product-1", quantity: 2 })).rejects.toMatchObject({
      message: "Investor is not eligible for this product.",
    });
  });

  it("creates pending orders for valid inputs", async () => {
    const repository = new FakeRepository();
    repository.user = makeUserProfile({ id: "investor-1", investorType: "PRO" });
    repository.product = makeProduct({ eligibleInvestorType: "PRO", unitPrice: 250 });
    const service = new InvestmentPlatformService(repository, new FixedIdGenerator(), new FixedClock());

    const order = await service.startOrder({
      investorId: "investor-1",
      listingId: "listing-1",
      productId: "product-1",
      quantity: 3,
      paymentProvider: "bank-transfer",
    });

    expect(order).toMatchObject({ status: "pending", total: 750, paymentProvider: "bank-transfer" });
    expect(repository.createdOrder).toMatchObject({ providerUserId: "provider-1", total: 750 });
  });

  it("only completes pending orders and decrements remaining supply", async () => {
    const repository = new FakeRepository();
    const service = new InvestmentPlatformService(repository, new FixedIdGenerator(), new FixedClock());

    repository.order = makeOrder({ status: "paid" });
    await expect(service.completeOrderPayment({ orderId: "order-1" })).rejects.toMatchObject({
      message: "Only pending payment orders can be completed.",
    });

    repository.order = makeOrder({ status: "pending", quantity: 2 });
    repository.product = makeProduct({ remainingSupply: 5 });
    const completed = await service.completeOrderPayment({ orderId: "order-1" });

    expect(repository.updatedProduct?.remainingSupply).toBe(3);
    expect(completed.status).toBe("paid");
    expect(repository.updatedOrder?.status).toBe("paid");
  });
});