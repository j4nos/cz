import type { Order } from "@/src/domain/entities";

export interface OrderController {
  placeOrder: (input: {
    investorId: string;
    listingId: string;
    productId: string;
    quantity: number;
    paymentProvider?: string;
    investorWalletAddress?: string;
  }) => Promise<Order>;
  completeOrder: (orderId: string) => Promise<Order>;
  markOrderWithdrawn: (orderId: string, walletAddress: string) => Promise<Order | null>;
}
