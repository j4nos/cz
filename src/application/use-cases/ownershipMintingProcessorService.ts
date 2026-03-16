import type { Asset, Listing, MintRequest, Order } from "@/src/domain/entities";
import type { RequestClaimPort } from "@/src/application/interfaces/requestClaimPort";
import type { InvestmentRepository } from "@/src/domain/repositories/investmentRepository";

type MintingRepository = Pick<
  InvestmentRepository,
  "getMintRequestById" | "updateOrder" | "updateMintRequest"
>;

export interface OwnershipMintingGateway {
  mint(input: {
    tokenAddress: string;
    to: string;
    amount: number;
    tokenStandard?: string;
  }): Promise<{ txHash: string; tokenId?: string }>;
}

export class OwnershipMintingProcessorService {
  constructor(
    private readonly repository: MintingRepository,
    private readonly gateway: OwnershipMintingGateway,
    private readonly requestClaimPort: RequestClaimPort,
  ) {}

  async process(input: {
    request: MintRequest;
    order: Order;
    listing: Listing;
    asset: Asset;
    walletAddress: string;
  }): Promise<
    | { status: "pending"; mintRequestedAt: string }
    | { status: "minted"; mintRequestedAt: string; mintedAt: string; txHash: string }
  > {
    const { request, order, asset, walletAddress } = input;

    if (request.mintStatus === "minted") {
      return {
        status: "minted",
        mintRequestedAt: order.mintRequestedAt ?? request.createdAt,
        mintedAt: order.mintedAt ?? request.updatedAt,
        txHash: order.mintTxHash ?? request.blockchainTxHash ?? "",
      };
    }

    if (request.mintStatus === "submitting" || request.mintStatus === "submitted") {
      return {
        status: "pending",
        mintRequestedAt: order.mintRequestedAt ?? request.createdAt,
      };
    }

    const submittingAt = new Date().toISOString();
    const claimed = await this.requestClaimPort.claimMintRequest({
      requestId: request.id,
      claimedAt: submittingAt,
    });

    if (!claimed) {
      const currentRequest = await this.repository.getMintRequestById(request.id);
      if (currentRequest?.mintStatus === "minted") {
        return {
          status: "minted",
          mintRequestedAt: order.mintRequestedAt ?? currentRequest.createdAt,
          mintedAt: order.mintedAt ?? currentRequest.updatedAt,
          txHash: order.mintTxHash ?? currentRequest.blockchainTxHash ?? "",
        };
      }

      return {
        status: "pending",
        mintRequestedAt: order.mintRequestedAt ?? currentRequest?.createdAt ?? request.createdAt,
      };
    }

    const updatedRequest = await this.repository.getMintRequestById(request.id);
    if (!updatedRequest) {
      throw new Error("Mint request not found after claim.");
    }

    await this.repository.updateOrder({
      ...order,
      investorWalletAddress: walletAddress,
      mintRequestedAt: order.mintRequestedAt ?? updatedRequest.createdAt,
      mintingAt: submittingAt,
      mintError: undefined,
    });

    try {
      const minted = await this.gateway.mint({
        tokenAddress: asset.tokenAddress ?? "",
        to: walletAddress,
        amount: order.quantity,
        tokenStandard: asset.tokenStandard,
      });

      const submittedAt = new Date().toISOString();
      await this.repository.updateMintRequest({
        ...updatedRequest,
        mintStatus: "submitted",
        walletAddress,
        blockchainTxHash: minted.txHash,
        updatedAt: submittedAt,
      });

      const mintedAt = new Date().toISOString();
      await this.repository.updateMintRequest({
        ...updatedRequest,
        mintStatus: "minted",
        walletAddress,
        blockchainTxHash: minted.txHash,
        tokenId: minted.tokenId,
        updatedAt: mintedAt,
      });

      await this.repository.updateOrder({
        ...order,
        investorWalletAddress: walletAddress,
        mintRequestedAt: order.mintRequestedAt ?? updatedRequest.createdAt,
        mintingAt: submittedAt,
        mintTxHash: minted.txHash,
        mintError: undefined,
        mintedAt,
      });

      return {
        status: "minted",
        mintRequestedAt: order.mintRequestedAt ?? updatedRequest.createdAt,
        mintedAt,
        txHash: minted.txHash,
      };
    } catch (error) {
      const failedAt = new Date().toISOString();
      const message = error instanceof Error ? error.message : "Mint failed.";

      await this.repository.updateMintRequest({
        ...updatedRequest,
        mintStatus: "failed",
        walletAddress,
        retryCount: updatedRequest.retryCount + 1,
        errorMessage: message,
        updatedAt: failedAt,
      });

      await this.repository.updateOrder({
        ...order,
        investorWalletAddress: walletAddress,
        mintRequestedAt: order.mintRequestedAt ?? updatedRequest.createdAt,
        mintingAt: undefined,
        mintError: message,
      });

      throw error;
    }
  }
}
