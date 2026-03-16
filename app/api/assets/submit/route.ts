import { NextResponse } from "next/server";

import { buildAssetAfterContractDeployment } from "@/src/application/use-cases/contractDeploymentRules";
import { DomainError } from "@/src/domain/value-objects/errors";
import { verifyAccessToken } from "@/src/infrastructure/auth/verifyAccessToken";
import { createInvestmentRepository, createTokenizationService } from "@/src/infrastructure/composition/defaults";
import { createDomainErrorResponse } from "@/src/infrastructure/http/domainErrorResponse";

export const runtime = "nodejs";

class TokenizationRunIdGenerator {
  next(): string {
    return typeof crypto !== "undefined" ? crypto.randomUUID() : `run-${Date.now()}`;
  }
}

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

    const assetId = body.assetId?.trim() || "";
    const name = body.name?.trim() || "";
    const country = body.country?.trim() || "";
    const assetClass = body.assetClass?.trim() || "";
    const tokenStandard = body.tokenStandard?.trim() || "ERC-20";

    if (!assetId || !name || !country || !assetClass) {
      return NextResponse.json(
        { error: "assetId, name, country and assetClass are required." },
        { status: 400 },
      );
    }

    const repository = createInvestmentRepository();
    const asset = await repository.getAssetById(assetId);

    if (!asset) {
      return NextResponse.json({ error: "Asset not found." }, { status: 404 });
    }

    if (asset.tenantUserId !== userId) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    let tokenAddress = asset.tokenAddress;
    if (!tokenAddress) {
      const tokenizationService = createTokenizationService(repository);
      const tokenization = await tokenizationService.tokenizeAsset({
        assetId,
        userId,
        name,
        tokenStandard,
      });
      tokenAddress = tokenization.address;
    }

    const savedAsset = await repository.updateAsset(
      buildAssetAfterContractDeployment({
        existingAsset: asset,
        assetId,
        userId,
        name,
        country,
        assetClass,
        tokenStandard,
        tokenAddress,
      }),
    );

    return NextResponse.json({ asset: savedAsset });
  } catch (error) {
    if (error instanceof DomainError) {
      return createDomainErrorResponse(error);
    }

    const message = error instanceof Error ? error.message : "Failed to submit asset.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
