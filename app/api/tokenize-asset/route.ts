import { NextResponse } from "next/server";
import { generateClient } from "aws-amplify/data";

import type { Schema } from "@/amplify/data/resource";
import { ensureAmplifyConfigured } from "@/src/config/amplify";
import { verifyAccessToken } from "@/src/infrastructure/auth/verifyAccessToken";
import { EthersTokenizationGateway } from "@/src/infrastructure/gateways/ethersTokenizationGateway";

export const runtime = "nodejs";

function getClient() {
  ensureAmplifyConfigured();
  return generateClient<Schema>();
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length).trim()
      : "";

    if (!token) {
      return NextResponse.json({ error: "Missing bearer token." }, { status: 401 });
    }

    const { assetId, name, symbol, owner, tokenStandard } = (await request.json()) as {
      assetId?: string;
      name?: string;
      symbol?: string;
      owner?: string;
      tokenStandard?: string;
    };

    const cleanedAssetId = typeof assetId === "string" ? assetId.trim() : "";
    if (!cleanedAssetId) {
      return NextResponse.json({ error: "Missing assetId." }, { status: 400 });
    }

    const payload = await verifyAccessToken(token);
    const userId = payload.sub as string | undefined;
    if (!userId) {
      return NextResponse.json({ error: "Invalid token." }, { status: 401 });
    }

    const client = getClient();
    const assetRes = await client.models.Asset.get({ id: cleanedAssetId });
    if (!assetRes.data) {
      return NextResponse.json({ error: "Asset not found." }, { status: 404 });
    }

    if (assetRes.data.tenantUserId !== userId) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const gateway = new EthersTokenizationGateway();
    const result = await gateway.tokenize({
      assetId: cleanedAssetId,
      name: typeof name === "string" ? name : assetRes.data.name,
      symbol: typeof symbol === "string" ? symbol : "ASSET",
      owner: typeof owner === "string" ? owner : undefined,
      tokenStandard:
        typeof tokenStandard === "string"
          ? tokenStandard
          : assetRes.data.tokenStandard ?? undefined,
    });

    return NextResponse.json({
      address: result.address,
      standard: result.standard,
      supportsErc721: result.supportsErc721,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to deploy token.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
