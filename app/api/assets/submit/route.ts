import { NextResponse } from "next/server";

import outputs from "@/amplify_outputs.json";
import { buildAssetAfterContractDeployment } from "@/src/application/use-cases/contractDeploymentRules";
import type { Asset } from "@/src/domain/entities";
import { verifyAccessToken } from "@/src/infrastructure/auth/verifyAccessToken";
import { EthersTokenizationGateway } from "@/src/infrastructure/gateways/ethersTokenizationGateway";

export const runtime = "nodejs";

const GRAPHQL_URL = outputs.data?.url || "";

function getBearerToken(request: Request): string {
  const authHeader = request.headers.get("authorization") || "";
  return authHeader.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : "";
}

type GraphQlResponse<T> = {
  data?: T;
  errors?: Array<{ message?: string }>;
};

const assetSelection = `
  id
  tenantUserId
  name
  country
  assetClass
  beneficiaryIban
  beneficiaryLabel
  tokenStandard
  status
  missingDocsCount
  tokenAddress
  latestRunId
  imageUrls
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
    throw new Error(message);
  }

  if (!json.data) {
    throw new Error("GraphQL response missing data.");
  }

  return json.data;
}

async function getAssetById(assetId: string, token: string): Promise<Asset | null> {
  const data = await callGraphQl<{ getAsset: Asset | null }>(
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

async function updateAsset(asset: Asset, token: string): Promise<Asset> {
  const data = await callGraphQl<{ updateAsset: Asset | null }>(
    `
      mutation UpdateAsset($input: UpdateAssetInput!) {
        updateAsset(input: $input) {
          ${assetSelection}
        }
      }
    `,
    {
      input: {
        id: asset.id,
        tenantUserId: asset.tenantUserId,
        name: asset.name,
        country: asset.country,
        assetClass: asset.assetClass,
        beneficiaryIban: asset.beneficiaryIban,
        beneficiaryLabel: asset.beneficiaryLabel,
        tokenStandard: asset.tokenStandard,
        status: asset.status,
        missingDocsCount: asset.missingDocsCount,
        tokenAddress: asset.tokenAddress,
        latestRunId: asset.latestRunId,
        imageUrls: asset.imageUrls,
      },
    },
    token,
  );

  if (!data.updateAsset) {
    throw new Error("Asset update returned empty data.");
  }

  return data.updateAsset;
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

    const asset = await getAssetById(assetId, token);
    if (!asset) {
      return NextResponse.json({ error: "Asset not found." }, { status: 404 });
    }

    if (asset.tenantUserId !== userId) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    let tokenAddress = asset.tokenAddress;
    if (!tokenAddress) {
      const gateway = new EthersTokenizationGateway();
      const symbol = name.replace(/\W+/g, "").toUpperCase().slice(0, 6) || "ASSET";
      const tokenization = await gateway.tokenize({
        assetId,
        name,
        symbol,
        tokenStandard,
      });
      tokenAddress = tokenization.address;
    }

    const savedAsset = await updateAsset(
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
      token,
    );

    return NextResponse.json({ asset: savedAsset });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to submit asset.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
