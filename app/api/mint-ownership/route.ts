import { ethers } from "ethers";
import { NextResponse } from "next/server";

import { OwnershipMintingProcessorService } from "@/src/application/use-cases/ownershipMintingProcessorService";
import { verifyAccessToken } from "@/src/infrastructure/auth/verifyAccessToken";
import { EthersOwnershipMintingGateway } from "@/src/infrastructure/gateways/ethersOwnershipMintingGateway";
import { AmplifyInvestmentRepository } from "@/src/infrastructure/repositories/amplifyInvestmentRepository";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { orderId, walletAddress, to } = (await request.json()) as {
      orderId?: string;
      walletAddress?: string;
      to?: string;
    };
    const authHeader = request.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length).trim()
      : "";
    if (!token) {
      return NextResponse.json({ error: "Missing bearer token." }, { status: 401 });
    }
    const cleanedOrderId = typeof orderId === "string" ? orderId.trim() : "";
    if (!cleanedOrderId) {
      return NextResponse.json({ error: "Missing orderId." }, { status: 400 });
    }

    const payload = await verifyAccessToken(token);
    const userId = payload.sub as string | undefined;
    if (!userId) {
      return NextResponse.json({ error: "Invalid token." }, { status: 401 });
    }

    const repository = new AmplifyInvestmentRepository();
    const order = await repository.getOrderById(cleanedOrderId);
    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }
    if (order.status !== "paid") {
      return NextResponse.json(
        { error: "Order is not eligible for minting." },
        { status: 409 }
      );
    }
    if (order.requiresProviderConfirmation && !order.providerConfirmedAt) {
      return NextResponse.json(
        { error: "Order requires provider confirmation." },
        { status: 409 }
      );
    }
    const isInvestor = order.investorId === userId;
    const isProvider = order.providerUserId === userId;
    if (!isInvestor && !isProvider) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const resolvedWallet =
      typeof walletAddress === "string"
        ? walletAddress.trim()
        : typeof to === "string"
          ? to.trim()
          : "";
    if (!order.investorWalletAddress) {
      if (!resolvedWallet) {
        return NextResponse.json(
          { error: "Missing investor wallet address." },
          { status: 400 }
        );
      }
      if (!ethers.isAddress(resolvedWallet)) {
        return NextResponse.json(
          { error: "Invalid investor wallet address." },
          { status: 400 }
        );
      }
      order.investorWalletAddress = resolvedWallet;
    }

    const requestId = `mint:${order.id}`;
    const existingRequest = await repository.getMintRequestById(requestId);

    if (order.mintedAt || existingRequest?.mintStatus === "minted") {
      return NextResponse.json({
        status: "minted",
        mintedAt: order.mintedAt ?? existingRequest?.updatedAt,
        txHash: order.mintTxHash ?? existingRequest?.blockchainTxHash,
      });
    }

    if (
      existingRequest &&
      (existingRequest.mintStatus === "queued" ||
        existingRequest.mintStatus === "submitting" ||
        existingRequest.mintStatus === "submitted")
    ) {
      return NextResponse.json(
        {
          status: "pending",
          mintRequestedAt: order.mintRequestedAt ?? existingRequest.createdAt,
        },
        { status: 202 }
      );
    }

    const listing = await repository.getListingById(order.listingId);
    if (!listing) {
      return NextResponse.json({ error: "Listing not found." }, { status: 404 });
    }

    const asset = await repository.getAssetById(listing.assetId);
    if (!asset) {
      return NextResponse.json({ error: "Asset not found." }, { status: 404 });
    }

    const now = new Date().toISOString();
    const mintRequest = await repository.createMintRequestIfMissing({
      requestId,
      orderId: order.id,
      assetId: listing.assetId,
      idempotencyKey: requestId,
      walletAddress: order.investorWalletAddress,
      createdAt: now,
    });

    if (!mintRequest.request) {
      return NextResponse.json(
        { error: "Mint request could not be created." },
        { status: 500 }
      );
    }

    if (!mintRequest.created) {
      if (mintRequest.request.mintStatus === "minted") {
        return NextResponse.json({
          status: "minted",
          mintedAt: mintRequest.request.updatedAt,
          txHash: mintRequest.request.blockchainTxHash,
        });
      }

      if (
        mintRequest.request.mintStatus === "queued" ||
        mintRequest.request.mintStatus === "submitting" ||
        mintRequest.request.mintStatus === "submitted"
      ) {
        return NextResponse.json(
          {
            status: "pending",
            mintRequestedAt: mintRequest.request.createdAt,
          },
          { status: 202 }
        );
      }
    }
    const processor = new OwnershipMintingProcessorService(
      repository,
      new EthersOwnershipMintingGateway(),
    );
    const result = await processor.process({
      request: mintRequest.request,
      order,
      listing,
      asset,
      walletAddress: order.investorWalletAddress,
    });

    if (result.status === "pending") {
      return NextResponse.json(result, { status: 202 });
    }

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to mint tokens.";
    console.error("mint-ownership error", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
