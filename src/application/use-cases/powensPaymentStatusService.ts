import type { Order } from "@/src/domain/entities";
import { PowensPaymentSyncService } from "@/src/application/use-cases/powensPaymentSyncService";

type PaymentStatusRepository = {
  getOrderById(id: string): Promise<Order | null>;
};

type PowensPaymentStatusApi = {
  getAdminToken(): Promise<string>;
  getPaymentState(input: {
    adminToken: string;
    paymentProviderId: string;
  }): Promise<string>;
};

type PowensPaymentStatusResponse =
  | { status: 200; body: { paymentState: string; orderStatus: string } }
  | { status: number; body: { error: string } };

export class PowensPaymentStatusService {
  constructor(
    private readonly repository: PaymentStatusRepository,
    private readonly syncService: Pick<PowensPaymentSyncService, "syncByOrderId">,
    private readonly powensApi: PowensPaymentStatusApi,
  ) {}

  async fetchStatus(input: {
    orderId: string;
    userId: string;
  }): Promise<PowensPaymentStatusResponse> {
    console.log("[powens] payment-status fetch start", {
      orderId: input.orderId,
      userId: input.userId,
    });
    const order = await this.repository.getOrderById(input.orderId);
    console.log("[powens] payment-status order loaded", {
      orderId: order?.id,
      status: order?.status,
      paymentProviderId: order?.paymentProviderId,
    });
    if (!order) {
      return { status: 404, body: { error: "Order not found." } };
    }

    if (order.investorId !== input.userId) {
      return { status: 403, body: { error: "Forbidden." } };
    }

    if (!order.paymentProviderId) {
      return { status: 400, body: { error: "Order missing payment provider id." } };
    }

    let adminToken = "";
    try {
      adminToken = await this.powensApi.getAdminToken();
    } catch (error) {
      return {
        status: 502,
        body: {
          error: error instanceof Error ? error.message : "Failed to fetch access token.",
        },
      };
    }

    let paymentState = "";
    try {
      paymentState = await this.powensApi.getPaymentState({
        adminToken,
        paymentProviderId: order.paymentProviderId,
      });
      console.log("[powens] payment-status payment state", {
        orderId: order.id,
        paymentState,
      });
    } catch (error) {
      return {
        status: 502,
        body: {
          error: error instanceof Error ? error.message : "Failed to fetch payment.",
        },
      };
    }

    const syncedOrder = await this.syncService.syncByOrderId({
      orderId: order.id,
      paymentState,
    });
    console.log("[powens] payment-status synced order", {
      orderId: order.id,
      syncedStatus: syncedOrder?.status,
    });

    return {
      status: 200,
      body: {
        paymentState,
        orderStatus: syncedOrder?.status ?? order.status,
      },
    };
  }
}
