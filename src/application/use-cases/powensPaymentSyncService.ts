import type { Order } from "@/src/domain/entities";
import type { InvestmentRepository } from "@/src/domain/repositories/investmentRepository";

const normalizeState = (state?: string) => (state || "").toLowerCase();

export const mapPowensPaymentStateToOrderStatus = (state?: string) => {
  switch (normalizeState(state)) {
    case "done":
      return "paid" as const;
    case "rejected":
    case "cancelled":
    case "canceled":
      return "failed" as const;
    case "created":
    case "pending":
    case "accepted":
    case "validating":
      return "pending" as const;
    default:
      return undefined;
  }
};

export class PowensPaymentSyncService {
  constructor(
    private readonly repository: InvestmentRepository,
    private readonly completeOrderPayment: (input: { orderId: string }) => Promise<Order>,
  ) {}

  async syncByPaymentProviderId(input: {
    paymentProviderId: string;
    paymentState?: string;
  }): Promise<Order | null> {
    const order = await this.repository.findOrderByPaymentProviderId(input.paymentProviderId);
    if (!order) {
      return null;
    }

    return this.applyPaymentState(order, input.paymentState);
  }

  async syncByOrderId(input: {
    orderId: string;
    paymentState?: string;
  }): Promise<Order | null> {
    const order = await this.repository.getOrderById(input.orderId);
    if (!order) {
      return null;
    }

    return this.applyPaymentState(order, input.paymentState);
  }

  private async applyPaymentState(order: Order, paymentState?: string): Promise<Order> {
    const nextStatus = mapPowensPaymentStateToOrderStatus(paymentState);

    if (nextStatus === "paid" && order.status === "pending") {
      const paidOrder = await this.completeOrderPayment({
        orderId: order.id,
      });
      return this.repository.updateOrder({
        ...paidOrder,
        paymentProviderStatus: paymentState ?? paidOrder.paymentProviderStatus,
      });
    }

    return this.repository.updateOrder({
      ...order,
      status: nextStatus ?? order.status ?? "pending",
      paymentProviderStatus: paymentState ?? order.paymentProviderStatus ?? "",
    });
  }
}
