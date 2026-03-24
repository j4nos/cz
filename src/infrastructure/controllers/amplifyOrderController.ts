"use client";

import type { OrderPort } from "@/src/application/interfaces/orderPort";
import { InvestmentPlatformService } from "@/src/application/use-cases/investmentPlatformService";
import type { Order } from "@/src/domain/entities";

type OrderRepository = {
  getOrderById(orderId: string): Promise<Order | null>;
  updateOrder(order: Order): Promise<Order>;
};

export class AmplifyOrderController implements OrderPort {
  constructor(
    private readonly repository: OrderRepository,
    private readonly service: Pick<InvestmentPlatformService, "startOrder" | "completeOrderPayment">,
  ) {}

  async placeOrder(input: {
    investorId: string;
    listingId: string;
    productId: string;
    quantity: number;
    coupon?: string;
    notes?: string;
    paymentProvider?: string;
    investorWalletAddress?: string;
  }): Promise<Order> {
    return this.service.startOrder(input);
  }

  async completeOrder(orderId: string): Promise<Order> {
    return this.service.completeOrderPayment({ orderId });
  }

  async markOrderWithdrawn(orderId: string, walletAddress: string): Promise<Order | null> {
    const order = await this.repository.getOrderById(orderId);
    if (!order) {
      return null;
    }

    return this.repository.updateOrder({
      ...order,
      investorWalletAddress: walletAddress,
    });
  }
}
