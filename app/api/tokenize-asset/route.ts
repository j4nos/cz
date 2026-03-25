import { NextResponse } from "next/server";

import { createTokenizationService } from "@/src/infrastructure/composition/defaults";
import { verifyAccessToken } from "@/src/infrastructure/auth/verifyAccessToken";
import { DomainError } from "@/src/domain/value-objects/errors";

export const runtime = "nodejs";

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

    const result = await createTokenizationService(token).tokenizeAsset({
      assetId: cleanedAssetId,
      userId,
      name: typeof name === "string" ? name : undefined,
      symbol: typeof symbol === "string" ? symbol : undefined,
      owner: typeof owner === "string" ? owner : undefined,
      tokenStandard: typeof tokenStandard === "string" ? tokenStandard : undefined,
    });

    return NextResponse.json({
      address: result.address,
      standard: result.standard,
      supportsErc721: result.supportsErc721,
      runId: result.runId,
    });
  } catch (error) {
    if (error instanceof DomainError) {
      return NextResponse.json({ error: error.message }, { status: error.httpStatus });
    }

    const message =
      error instanceof Error ? error.message : "Failed to deploy token.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
