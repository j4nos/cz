import { NextResponse } from "next/server";

import type { Asset } from "@/src/domain/entities";
import { verifyAccessToken } from "@/src/infrastructure/auth/verifyAccessToken";
import { createInvestmentRepository } from "@/src/infrastructure/composition/defaults";

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

    const assetId = body.assetId?.trim() || crypto.randomUUID();
    const name = body.name?.trim() || "";
    const country = body.country?.trim() || "";
    const assetClass = body.assetClass?.trim() || "";
    const tokenStandard = body.tokenStandard?.trim() || "ERC-20";

    if (!name || !country || !assetClass) {
      return NextResponse.json(
        { error: "name, country and assetClass are required." },
        { status: 400 },
      );
    }

    const repository = createInvestmentRepository();
    const existingAsset = await repository.getAssetById(assetId);

    if (existingAsset && existingAsset.tenantUserId !== userId) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const asset: Asset = existingAsset
      ? {
          ...existingAsset,
          name,
          country,
          assetClass,
          tokenStandard,
        }
      : {
          id: assetId,
          tenantUserId: userId,
          name,
          country,
          assetClass,
          tokenStandard,
          status: "draft",
          missingDocsCount: 0,
          imageUrls: [],
        };

    const savedAsset = existingAsset
      ? await repository.updateAsset(asset)
      : await repository.createAsset(asset);

    return NextResponse.json({ asset: savedAsset });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save asset draft.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
