import type { Asset, Listing, Order } from "@/src/domain/entities";

export type MintOwnershipTokenStandard = "erc-20" | "erc-721";

export function getMintOwnershipTokenStandard(
  asset: Pick<Asset, "tokenStandard"> | null,
): MintOwnershipTokenStandard {
  return asset?.tokenStandard === "erc-721" ? "erc-721" : "erc-20";
}

export function getMintOwnershipError(input: {
  order: Pick<Order, "quantity" | "investorWalletAddress"> | null;
  listing: Pick<Listing, "assetId"> | null;
  asset: Pick<Asset, "tokenAddress" | "tokenStandard"> | null;
  walletAddress?: string;
  accessToken?: string | null;
}): string | undefined {
  const { order, listing, asset, walletAddress, accessToken } = input;

  if (!order) {
    return "Order not found.";
  }

  if (!listing) {
    return "Listing not found.";
  }

  if (!asset?.tokenAddress) {
    return "Missing token address for this listing.";
  }

  if (!order.investorWalletAddress && !walletAddress?.trim()) {
    return "Missing investor wallet address.";
  }

  if (!accessToken) {
    return "Missing access token.";
  }

  return undefined;
}

export function buildMintOwnershipRequest(input: {
  order: Pick<Order, "id" | "quantity" | "investorWalletAddress">;
  asset: Pick<Asset, "tokenAddress" | "tokenStandard">;
  walletAddress?: string;
}) {
  return {
    tokenAddress: input.asset.tokenAddress,
    to: input.walletAddress?.trim() || input.order.investorWalletAddress || "",
    amount: input.order.quantity,
    orderId: input.order.id,
    tokenStandard: getMintOwnershipTokenStandard(input.asset),
  };
}

export function getMintOwnershipSuccessMessage(result: {
  status?: string;
  txHash?: string;
}): { message: string; tone: "success" | "warning" } {
  if (result.status === "queued" || result.status === "pending") {
    return {
      message: "Withdraw queued for minting.",
      tone: "warning",
    };
  }

  return {
    message: result.txHash
      ? `Withdraw initiated. Tx: ${result.txHash}`
      : "Withdraw initiated on-chain.",
    tone: "success",
  };
}
