import { NextResponse } from "next/server";

import { DomainError } from "@/src/domain/value-objects/errors";
import { verifyAccessToken } from "@/src/infrastructure/auth/verifyAccessToken";
import { createSubmitAssetService } from "@/src/infrastructure/composition/defaults";

export const runtime = "nodejs";

function getBearerToken(request: Request): string {
  const authHeader = request.headers.get("authorization") || "";
  return authHeader.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : "";
}

export async function POST(request: Request) {
  const token = getBearerToken(request);
  if (!token) {
    return NextResponse.json({ error: "Missing bearer token." }, { status: 401 });
  }

  try {
    const payload = await verifyAccessToken(token);
    const userId = payload.sub as string | undefined;
    console.info("[assets-submit] verified access token", {
      sub: userId,
      rawSub: payload.sub as string | undefined,
      tokenUse: payload.token_use,
      clientId: payload.client_id,
      username: payload.username,
    });
    if (!userId) {
      return NextResponse.json({ error: "Invalid token." }, { status: 401 });
    }

    const body = (await request.json()) as {
      assetId?: string;
      name?: string;
      country?: string;
      assetClass?: string;
      tokenStandard?: string;
    };

    const assetId = body.assetId?.trim() || "";
    const name = body.name?.trim() || "";
    const country = body.country?.trim() || "";
    const assetClass = body.assetClass?.trim() || "";
    const tokenStandard = body.tokenStandard?.trim() || "ERC-20";

    if (!assetId || !name || !country || !assetClass) {
      console.warn("[assets-submit] missing required fields", {
        assetId,
        hasName: Boolean(name),
        hasCountry: Boolean(country),
        hasAssetClass: Boolean(assetClass),
      });
      return NextResponse.json(
        { error: "assetId, name, country and assetClass are required." },
        { status: 400 },
      );
    }

    const savedAsset = await createSubmitAssetService(token).submit({
      assetId,
      userId,
      name,
      country,
      assetClass,
      tokenStandard,
    });

    console.info("[assets-submit] asset submitted", {
      assetId: savedAsset.id,
      status: savedAsset.status,
      tokenAddress: savedAsset.tokenAddress ?? null,
    });

    return NextResponse.json({ asset: savedAsset });
  } catch (error) {
    if (error instanceof DomainError) {
      return NextResponse.json({ error: error.message }, { status: error.httpStatus });
    }

    const message = error instanceof Error ? error.message : "Failed to submit asset.";
    console.error("[assets-submit] submit failed", {
      message,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
