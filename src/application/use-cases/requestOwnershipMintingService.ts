import type { Asset, Listing, MintRequest, Order } from "@/src/domain/entities";
import { OwnershipMintingProcessorService } from "@/src/application/use-cases/ownershipMintingProcessorService";

type MintingRepository = {
  getOrderById(id: string): Promise<Order | null>;
  getListingById(id: string): Promise<Listing | null>;
  getAssetById(id: string): Promise<Asset | null>;
  getMintRequestById(id: string): Promise<MintRequest | null>;
  createMintRequestIfMissing(input: {
    requestId: string;
    orderId: string;
    assetId: string;
    idempotencyKey: string;
    walletAddress?: string;
    createdAt: string;
  }): Promise<{ request: MintRequest | null; created: boolean }>;
};

type MintOwnershipResponse =
  | { status: 200; body: { status: "minted"; mintRequestedAt?: string; mintedAt: string; txHash: string } }
  | { status: 202; body: { status: "pending"; mintRequestedAt?: string } }
  | { status: number; body: { error: string } };

export class RequestOwnershipMintingService {
  constructor(
    private readonly repository: MintingRepository,
    private readonly processor: Pick<OwnershipMintingProcessorService, "process">,
    private readonly isAddress: (value: string) => boolean,
  ) {}

  async requestMint(input: {
    orderId: string;
    userId: string;
    walletAddress?: string;
  }): Promise<MintOwnershipResponse> {
    const order = await this.repository.getOrderById(input.orderId);
    if (!order) {
      return { status: 404, body: { error: "Order not found." } };
    }

    if (order.status !== "paid") {
      return { status: 409, body: { error: "Order is not eligible for minting." } };
    }

    if (order.requiresProviderConfirmation && !order.providerConfirmedAt) {
      return { status: 409, body: { error: "Order requires provider confirmation." } };
    }

    const isInvestor = order.investorId === input.userId;
    const isProvider = order.providerUserId === input.userId;
    if (!isInvestor && !isProvider) {
      return { status: 403, body: { error: "Forbidden." } };
    }

    const resolvedWallet = input.walletAddress?.trim() || "";
    const effectiveWallet = order.investorWalletAddress?.trim() || resolvedWallet;

    if (!effectiveWallet) {
      return { status: 400, body: { error: "Missing investor wallet address." } };
    }

    if (!this.isAddress(effectiveWallet)) {
      return { status: 400, body: { error: "Invalid investor wallet address." } };
    }

    if (
      order.investorWalletAddress?.trim() &&
      resolvedWallet &&
      order.investorWalletAddress.trim() !== resolvedWallet
    ) {
      return { status: 409, body: { error: "Order already has a different investor wallet address." } };
    }

    if (order.mintedAt) {
      return {
        status: 200,
        body: {
          status: "minted",
          mintRequestedAt: order.mintRequestedAt ?? undefined,
          mintedAt: order.mintedAt,
          txHash: order.mintTxHash ?? "",
        },
      };
    }

    const requestId = `mint:${order.id}`;
    const existingRequest = await this.repository.getMintRequestById(requestId);
    if (existingRequest?.mintStatus === "minted") {
      return {
        status: 200,
        body: {
          status: "minted",
          mintRequestedAt: order.mintRequestedAt ?? existingRequest.createdAt,
          mintedAt: order.mintedAt ?? existingRequest.updatedAt,
          txHash: order.mintTxHash ?? existingRequest.blockchainTxHash ?? "",
        },
      };
    }

    if (
      existingRequest &&
      ["queued", "submitting", "submitted"].includes(existingRequest.mintStatus)
    ) {
      return {
        status: 202,
        body: {
          status: "pending",
          mintRequestedAt: order.mintRequestedAt ?? existingRequest.createdAt,
        },
      };
    }

    const listing = await this.repository.getListingById(order.listingId);
    if (!listing) {
      return { status: 404, body: { error: "Listing not found." } };
    }

    const asset = await this.repository.getAssetById(listing.assetId);
    if (!asset?.tokenAddress) {
      return { status: 409, body: { error: "Missing token address for this listing." } };
    }

    const created = await this.repository.createMintRequestIfMissing({
      requestId,
      orderId: order.id,
      assetId: asset.id,
      idempotencyKey: requestId,
      walletAddress: effectiveWallet,
      createdAt: new Date().toISOString(),
    });

    const request = created.request;
    if (!request) {
      return { status: 500, body: { error: "Mint request could not be created." } };
    }

    if (!created.created) {
      if (request.mintStatus === "minted") {
        return {
          status: 200,
          body: {
            status: "minted",
            mintRequestedAt: order.mintRequestedAt ?? request.createdAt,
            mintedAt: order.mintedAt ?? request.updatedAt,
            txHash: order.mintTxHash ?? request.blockchainTxHash ?? "",
          },
        };
      }

      return {
        status: 202,
        body: {
          status: "pending",
          mintRequestedAt: order.mintRequestedAt ?? request.createdAt,
        },
      };
    }

    const result = await this.processor.process({
      request,
      order,
      listing,
      asset,
      walletAddress: effectiveWallet,
    });

    if (result.status === "pending") {
      return {
        status: 202,
        body: {
          status: "pending",
          mintRequestedAt: result.mintRequestedAt,
        },
      };
    }

    return {
      status: 200,
      body: {
        status: "minted",
        mintRequestedAt: result.mintRequestedAt,
        mintedAt: result.mintedAt,
        txHash: result.txHash,
      },
    };
  }
}
