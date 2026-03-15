import { NextResponse } from "next/server";

import { TokenizationService } from "@/src/application/use-cases/tokenizationService";
import { EthersTokenizationGateway } from "@/src/infrastructure/gateways/ethersTokenizationGateway";
import { AmplifyInvestmentRepository } from "@/src/infrastructure/repositories/amplifyInvestmentRepository";
import { DomainError } from "@/src/domain/value-objects/errors";

export const runtime = "nodejs";

class TokenizationRunIdGenerator {
  next(): string {
    return typeof crypto !== "undefined" ? crypto.randomUUID() : `run-${Date.now()}`;
  }
}

function createService() {
  return new TokenizationService(
    new AmplifyInvestmentRepository(),
    new EthersTokenizationGateway(),
    new TokenizationRunIdGenerator(),
  );
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      assetId?: string;
      userId?: string;
      name?: string;
      symbol?: string;
      owner?: string;
      tokenStandard?: string;
    };

    const assetId = body.assetId?.trim();
    const userId = body.userId?.trim();

    if (!assetId || !userId) {
      return NextResponse.json({ error: "assetId and userId are required." }, { status: 400 });
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
      const status =
        error.message === "Asset not found."
          ? 404
          : error.message === "Forbidden."
          ? 403
          : error.message === "Invalid owner address."
          ? 400
          : error.message === "RPC or private key missing."
          ? 500
          : 400;
      return NextResponse.json({ error: error.message }, { status });
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
