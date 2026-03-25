import { NextResponse } from "next/server";

import { verifyAccessToken } from "@/src/infrastructure/auth/verifyAccessToken";
import { createSaveAssetDraftService } from "@/src/infrastructure/composition/defaults";

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
    const result = await createSaveAssetDraftService(token).save({
      assetId: body.assetId,
      userId,
      name: body.name ?? "",
      country: body.country ?? "",
      assetClass: body.assetClass ?? "",
      tokenStandard: body.tokenStandard,
    });
    if (result.kind === "error") {
      return NextResponse.json({ error: result.message }, { status: result.status });
    }

    return NextResponse.json({ asset: result.asset });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save asset draft.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
