import type { Schema } from "@/amplify/data/resource";
import type { MintRequest, Order } from "@/src/domain/entities";
import { listAll } from "@/src/infrastructure/amplify/pagination";
import { mapOrderRecord } from "@/src/infrastructure/amplify/schemaMappers";
import type { AmplifyDataClient } from "@/src/infrastructure/repositories/amplifyClient";
import { mapMintRequestRecord } from "@/src/infrastructure/repositories/amplifyWorkflowRecords";

export class AmplifyOrderRepository {
  constructor(private readonly client: AmplifyDataClient) {}

  async createOrder(input: Order): Promise<Order> {
    const response = await this.client.models.Order.create({
      id: input.id,
      investorId: input.investorId,
      providerUserId: input.providerUserId,
      listingId: input.listingId,
      productId: input.productId,
      quantity: input.quantity,
      unitPrice: input.unitPrice,
      total: input.total,
      status: input.status,
      currency: input.currency,
      paymentProvider: input.paymentProvider,
      paymentProviderId: input.paymentProviderId,
      paymentProviderStatus: input.paymentProviderStatus,
      investorWalletAddress: input.investorWalletAddress,
    });

    return response.data ? mapOrderRecord(response.data) : input;
  }

  async getOrderById(id: string): Promise<Order | null> {
    const response = await this.client.models.Order.get({ id });
    return response.data ? mapOrderRecord(response.data) : null;
  }

  async findOrderByPaymentProviderId(paymentProviderId: string): Promise<Order | null> {
    const records = await listAll<Schema["Order"]["type"]>((nextToken) =>
      this.client.models.Order.list({
        filter: { paymentProviderId: { eq: paymentProviderId } },
        ...(nextToken ? { nextToken } : {}),
      }),
    );

    const [first] = records;
    return first ? mapOrderRecord(first) : null;
  }

  async updateOrder(order: Order): Promise<Order> {
    const response = await this.client.models.Order.update({
      id: order.id,
      status: order.status,
      paymentProvider: order.paymentProvider,
      paymentProviderId: order.paymentProviderId,
      paymentProviderStatus: order.paymentProviderStatus,
      investorWalletAddress: order.investorWalletAddress,
      mintRequestedAt: order.mintRequestedAt,
      mintingAt: order.mintingAt,
      mintTxHash: order.mintTxHash,
      mintError: order.mintError,
      mintedAt: order.mintedAt,
      withdrawnAt: order.withdrawnAt,
      providerConfirmedAt: order.providerConfirmedAt,
      providerConfirmedBy: order.providerConfirmedBy,
    });

    return response.data ? mapOrderRecord(response.data) : order;
  }

  async listOrdersByInvestor(investorId: string): Promise<Order[]> {
    const records = await listAll<Schema["Order"]["type"]>((nextToken) =>
      this.client.models.Order.list({
        filter: { investorId: { eq: investorId } },
        ...(nextToken ? { nextToken } : {}),
      }),
    );
    return records.map(mapOrderRecord);
  }

  async listOrdersByProvider(providerUserId: string): Promise<Order[]> {
    const records = await listAll<Schema["Order"]["type"]>((nextToken) =>
      this.client.models.Order.list({
        filter: { providerUserId: { eq: providerUserId } },
        ...(nextToken ? { nextToken } : {}),
      }),
    );
    return records.map(mapOrderRecord);
  }

  async getMintRequestById(id: string): Promise<MintRequest | null> {
    const response = await this.client.models.MintRequest.get({ id });
    return response.data ? mapMintRequestRecord(response.data) : null;
  }

  async createMintRequestIfMissing(input: {
    requestId: string;
    orderId: string;
    assetId: string;
    idempotencyKey: string;
    walletAddress?: string;
    createdAt: string;
  }): Promise<{ request: MintRequest | null; created: boolean }> {
    try {
      const response = await this.client.models.MintRequest.create({
        id: input.requestId,
        orderId: input.orderId,
        assetId: input.assetId,
        idempotencyKey: input.idempotencyKey,
        mintStatus: "queued",
        walletAddress: input.walletAddress,
        retryCount: 0,
        createdAt: input.createdAt,
        updatedAt: input.createdAt,
      });

      if (response.data) {
        return {
          request: mapMintRequestRecord(response.data),
          created: true,
        };
      }
    } catch {
      // Duplicate creates can happen under concurrent requests. In that case
      // we treat the existing request as the idempotent winner.
    }

    return {
      request: await this.getMintRequestById(input.requestId),
      created: false,
    };
  }

  async updateMintRequest(input: MintRequest): Promise<MintRequest> {
    const response = await this.client.models.MintRequest.update({
      id: input.id,
      orderId: input.orderId,
      assetId: input.assetId,
      idempotencyKey: input.idempotencyKey,
      mintStatus: input.mintStatus,
      walletAddress: input.walletAddress,
      blockchainTxHash: input.blockchainTxHash,
      tokenId: input.tokenId,
      retryCount: input.retryCount,
      errorCode: input.errorCode,
      errorMessage: input.errorMessage,
      createdAt: input.createdAt,
      updatedAt: input.updatedAt,
    });

    return response.data ? mapMintRequestRecord(response.data) : input;
  }
}