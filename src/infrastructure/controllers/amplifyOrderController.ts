"use client";

import type { OrderController } from "@/src/application/orderController";
import { InvestmentPlatformService } from "@/src/application/useCases";
import type { Order } from "@/src/domain/entities";
import { AmplifyInvestmentRepository } from "@/src/infrastructure/repositories/amplifyInvestmentRepository";

class AmplifyIdGenerator {
  next(): string {
    return `id-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
}

class AmplifyClock {
  now(): string {
    return new Date().toISOString();
  }
}

export class AmplifyOrderController implements OrderController {
  private readonly repository = new AmplifyInvestmentRepository();
  private readonly service = new InvestmentPlatformService(this.repository, new AmplifyIdGenerator(), new AmplifyClock());

  async placeOrder(input: {
    investorId: string;
    listingId: string;
    productId: string;
    quantity: number;
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
