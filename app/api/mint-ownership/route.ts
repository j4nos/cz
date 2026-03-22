import { ethers } from "ethers";
import { NextResponse } from "next/server";

import outputs from "@/amplify_outputs.json";
import { verifyAccessToken } from "@/src/infrastructure/auth/verifyAccessToken";
import { EthersOwnershipMintingGateway } from "@/src/infrastructure/gateways/ethersOwnershipMintingGateway";

export const runtime = "nodejs";

const GRAPHQL_URL = outputs.data?.url || "";

type GraphQlResponse<T> = {
  data?: T;
  errors?: Array<{ message?: string }>;
};

type OrderRecord = {
  id: string;
  investorId: string;
  providerUserId: string;
  listingId: string;
  quantity: number;
  status: string;
  requiresProviderConfirmation?: boolean | null;
  providerConfirmedAt?: string | null;
  investorWalletAddress?: string | null;
  mintRequestedAt?: string | null;
  mintingAt?: string | null;
  mintTxHash?: string | null;
  mintError?: string | null;
  mintedAt?: string | null;
};

type ListingRecord = {
  id: string;
  assetId: string;
};

type AssetRecord = {
  id: string;
  tokenAddress?: string | null;
  tokenStandard?: string | null;
};

const orderSelection = `
  id
  investorId
  providerUserId
  listingId
  quantity
  status
  requiresProviderConfirmation
  providerConfirmedAt
  investorWalletAddress
  mintRequestedAt
  mintingAt
  mintTxHash
  mintError
  mintedAt
`;

const listingSelection = `
  id
  assetId
`;

const assetSelection = `
  id
  tokenAddress
  tokenStandard
`;

async function callGraphQl<T>(
  query: string,
  variables: Record<string, unknown>,
  token: string,
): Promise<T> {
  if (!GRAPHQL_URL) {
    throw new Error("Missing Amplify Data GraphQL URL.");
  }

  const response = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: token,
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });

  const json = (await response.json()) as GraphQlResponse<T>;
  if (!response.ok || json.errors?.length) {
    const message = json.errors?.[0]?.message || "GraphQL request failed.";
    console.error("[mint-ownership] GraphQL request failed", {
      status: response.status,
      message,
      variables,
      errors: json.errors,
    });
    throw new Error(message);
  }

  if (!json.data) {
    throw new Error("GraphQL response missing data.");
  }

  return json.data;
}

async function getOrderById(orderId: string, token: string): Promise<OrderRecord | null> {
  const data = await callGraphQl<{ getOrder: OrderRecord | null }>(
    `
      query GetOrder($id: ID!) {
        getOrder(id: $id) {
          ${orderSelection}
        }
      }
    `,
    { id: orderId },
    token,
  );

  return data.getOrder;
}

async function getListingById(listingId: string, token: string): Promise<ListingRecord | null> {
  const data = await callGraphQl<{ getListing: ListingRecord | null }>(
    `
      query GetListing($id: ID!) {
        getListing(id: $id) {
          ${listingSelection}
        }
      }
    `,
    { id: listingId },
    token,
  );

  return data.getListing;
}

async function getAssetById(assetId: string, token: string): Promise<AssetRecord | null> {
  const data = await callGraphQl<{ getAsset: AssetRecord | null }>(
    `
      query GetAsset($id: ID!) {
        getAsset(id: $id) {
          ${assetSelection}
        }
      }
    `,
    { id: assetId },
    token,
  );

  return data.getAsset;
}

async function updateOrder(
  input: Record<string, unknown>,
  token: string,
): Promise<void> {
  await callGraphQl<{ updateOrder: { id: string } | null }>(
    `
      mutation UpdateOrder($input: UpdateOrderInput!) {
        updateOrder(input: $input) {
          id
        }
      }
    `,
    { input },
    token,
  );
}

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

    const order = await getOrderById(cleanedOrderId, token);
    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }
    if (order.status !== "paid") {
      return NextResponse.json(
        { error: "Order is not eligible for minting." },
        { status: 409 },
      );
    }
    if (order.requiresProviderConfirmation && !order.providerConfirmedAt) {
      return NextResponse.json(
        { error: "Order requires provider confirmation." },
        { status: 409 },
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
          { status: 400 },
        );
      }
      if (!ethers.isAddress(resolvedWallet)) {
        return NextResponse.json(
          { error: "Invalid investor wallet address." },
          { status: 400 },
        );
      }

      await updateOrder(
        {
          id: order.id,
          investorWalletAddress: resolvedWallet,
        },
        token,
      );
      order.investorWalletAddress = resolvedWallet;
    }

    if (order.mintedAt) {
      return NextResponse.json({
        status: "minted",
        mintedAt: order.mintedAt,
        txHash: order.mintTxHash ?? undefined,
      });
    }

    const listing = await getListingById(order.listingId, token);
    if (!listing) {
      return NextResponse.json({ error: "Listing not found." }, { status: 404 });
    }

    const asset = await getAssetById(listing.assetId, token);
    if (!asset?.tokenAddress) {
      return NextResponse.json(
        { error: "Missing token address for this listing." },
        { status: 409 },
      );
    }

    const mintRequestedAt = order.mintRequestedAt || new Date().toISOString();
    const mintingAt = new Date().toISOString();
    await updateOrder(
      {
        id: order.id,
        investorWalletAddress: order.investorWalletAddress,
        mintRequestedAt,
        mintingAt,
        mintError: null,
      },
      token,
    );

    const gateway = new EthersOwnershipMintingGateway();
    const minted = await gateway.mint({
      tokenAddress: asset.tokenAddress,
      to: order.investorWalletAddress,
      amount: order.quantity,
      tokenStandard: asset.tokenStandard ?? undefined,
    });

    const mintedAt = new Date().toISOString();
    await updateOrder(
      {
        id: order.id,
        investorWalletAddress: order.investorWalletAddress,
        mintRequestedAt,
        mintingAt,
        mintTxHash: minted.txHash,
        mintError: null,
        mintedAt,
      },
      token,
    );

    return NextResponse.json(
      { status: "minted", mintRequestedAt, mintedAt, txHash: minted.txHash },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to mint tokens.";
    console.error("mint-ownership error", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
