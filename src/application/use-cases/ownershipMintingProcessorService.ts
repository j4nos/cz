import type { Asset, Listing, MintRequest, Order } from "@/src/domain/entities";
import type { InvestmentRepository } from "@/src/domain/repositories/investmentRepository";

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
    private readonly repository: InvestmentRepository,
    private readonly gateway: OwnershipMintingGateway,
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
    const updatedRequest = await this.repository.updateMintRequest({
      ...request,
      mintStatus: "submitting",
      walletAddress,
      errorCode: undefined,
      errorMessage: undefined,
      updatedAt: submittingAt,
    });

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
        withdrawnAt: mintedAt,
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
