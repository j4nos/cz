import { NextResponse } from "next/server";

import { verifyAccessToken } from "@/src/infrastructure/auth/verifyAccessToken";
import { DomainError } from "@/src/domain/value-objects/errors";
import { createTokenizationService } from "@/src/infrastructure/composition/defaults";
import { createDomainErrorResponse } from "@/src/infrastructure/http/domainErrorResponse";

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

    const payload = await verifyAccessToken(token);
    const userId = payload.sub as string | undefined;
    if (!userId) {
      return NextResponse.json({ error: "Invalid token." }, { status: 401 });
    }

    const body = (await request.json()) as {
      assetId?: string;
      name?: string;
      symbol?: string;
      owner?: string;
      tokenStandard?: string;
    };

    const assetId = body.assetId?.trim();

    if (!assetId) {
      return NextResponse.json({ error: "assetId is required." }, { status: 400 });
    }

    const service = createService();
    const result = await service.tokenizeAsset({
      assetId,
      userId,
      name: body.name,
      symbol: body.symbol,
      owner: body.owner,
      tokenStandard: body.tokenStandard,
    });

    return NextResponse.json({
      address: result.address,
      standard: result.standard,
      supportsErc721: result.supportsErc721,
      runId: result.runId,
    });
  } catch (error) {
    if (error instanceof DomainError) {
      return createDomainErrorResponse(error);
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function createService() {
  return createTokenizationService();
}
