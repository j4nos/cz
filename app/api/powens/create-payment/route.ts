import { NextResponse } from "next/server";
import outputs from "@/amplify_outputs.json";
import { verifyAccessToken } from "@/src/infrastructure/auth/verifyAccessToken";
import { getPowensEnv } from "@/src/config/powensEnv";
import { getAppUrlEnv } from "@/src/config/runtimeEnv";

export const runtime = "nodejs";

const GRAPHQL_URL = outputs.data?.url || "";

const normalizeBaseUrl = (value: string) => value.replace(/\/+$/, "");

const getPowensBaseUrl = () => {
  const { POWENS_DOMAIN: domain } = getPowensEnv();
  return domain ? `https://${domain}.biapi.pro/2.0` : "";
};

type PowensPaymentResponse = {
  id?: number | string;
  state?: string;
  error?: string;
  message?: string;
};

type PowensTokenResponse = {
  token?: string;
  access_token?: string;
  error?: string;
  message?: string;
};

type PowensPaymentTokenResponse = {
  token?: string;
  scope?: string;
  id_payment?: number | string;
  error?: string;
  message?: string;
};

type GraphQlResponse<T> = {
  data?: T;
  errors?: Array<{ message?: string }>;
};

type OrderRecord = {
  id: string;
  investorId: string;
  providerUserId: string;
  listingId: string;
  productId: string;
  total: number;
  currency: string;
  paymentProvider?: string | null;
  paymentProviderId?: string | null;
  paymentProviderStatus?: string | null;
};

type ListingRecord = {
  id: string;
  assetId: string;
};

type AssetRecord = {
  id: string;
  beneficiaryIban?: string | null;
  beneficiaryLabel?: string | null;
};

const orderSelection = `
  id
  investorId
  providerUserId
  listingId
  productId
  total
  currency
  paymentProvider
  paymentProviderId
  paymentProviderStatus
`;

const listingSelection = `
  id
  assetId
`;

const assetSelection = `
  id
  beneficiaryIban
  beneficiaryLabel
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
    console.error("[powens] GraphQL request failed", {
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

async function updateOrderPayment(
  orderId: string,
  paymentProviderId: string,
  paymentProviderStatus: string,
  token: string,
) {
  await callGraphQl<{ updateOrder: { id: string } | null }>(
    `
      mutation UpdateOrder($input: UpdateOrderInput!) {
        updateOrder(input: $input) {
          id
        }
      }
    `,
    {
      input: {
        id: orderId,
        paymentProviderId,
        paymentProviderStatus,
      },
    },
    token,
  );
}

const getPowensTokenUrl = (baseUrl: string) =>
  normalizeBaseUrl(`${baseUrl}/auth/token`);

const getPowensAccessToken = async (baseUrl: string, scope: string) => {
  const { POWENS_CLIENT_ID: clientId, POWENS_CLIENT_SECRET: clientSecret } =
    getPowensEnv();
  const tokenUrl = getPowensTokenUrl(baseUrl);
  const body = JSON.stringify({
    scope,
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
  });
  const tokenRes = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
  const tokenData = (await tokenRes.json()) as PowensTokenResponse;
  const accessToken = tokenData.token || tokenData.access_token || "";
  if (!tokenRes.ok || !accessToken) {
    throw new Error(
      tokenData.error || tokenData.message || "Failed to fetch access token.",
    );
  }
  return accessToken;
};

const getPowensPaymentScopedToken = async (
  baseUrl: string,
  paymentId: string,
  accessToken: string,
) => {
  const scopedTokenUrl = normalizeBaseUrl(
    `${baseUrl}/payments/${paymentId}/scopedtoken`,
  );
  const scopedRes = await fetch(scopedTokenUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ scope: "payments:validate" }),
  });
  const scopedRaw = await scopedRes.text();
  const scopedData = (() => {
    try {
      return JSON.parse(scopedRaw) as PowensPaymentTokenResponse;
    } catch {
      return { message: scopedRaw } as PowensPaymentTokenResponse;
    }
  })();
  const scopedToken = scopedData.token || "";
  if (!scopedRes.ok || !scopedToken) {
    console.error("[powens] scoped token failed", {
      status: scopedRes.status,
      body: scopedRaw,
    });
    throw new Error(
      scopedData.error ||
        scopedData.message ||
        "Failed to fetch payment scoped token.",
    );
  }
  return scopedToken;
};

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

    const { orderId } = (await request.json()) as { orderId?: string };
    const cleanedOrderId = typeof orderId === "string" ? orderId.trim() : "";
    if (!cleanedOrderId) {
      return NextResponse.json({ error: "Missing orderId." }, { status: 400 });
    }

    const order = await getOrderById(cleanedOrderId, token);
    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }
    if (order.investorId !== userId) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }
    if ((order.paymentProvider ?? "") !== "bank-transfer") {
      return NextResponse.json(
        { error: "Order is not eligible for bank transfer." },
        { status: 400 },
      );
    }

    const { POWENS_CLIENT_ID: powensClientId } = getPowensEnv();
    const appUrl = normalizeBaseUrl(getAppUrlEnv());
    const powensBaseUrl = getPowensBaseUrl();

    const listingId = order.listingId ?? "";
    if (!listingId) {
      return NextResponse.json(
        { error: "Order is missing listingId." },
        { status: 400 },
      );
    }

    const listing = await getListingById(listingId, token);
    if (!listing?.assetId) {
      return NextResponse.json(
        { error: "Listing is missing asset." },
        { status: 400 },
      );
    }

    const asset = await getAssetById(listing.assetId, token);
    if (!asset) {
      return NextResponse.json({ error: "Asset not found." }, { status: 404 });
    }

    const beneficiaryIban = asset.beneficiaryIban?.trim() || "";
    const beneficiaryLabel = asset.beneficiaryLabel?.trim() || "";
    if (!beneficiaryIban || !beneficiaryLabel) {
      return NextResponse.json(
        { error: "Missing beneficiary details." },
        { status: 400 },
      );
    }

    let powensAdminToken = "";
    try {
      powensAdminToken = await getPowensAccessToken(
        powensBaseUrl,
        "payments:admin",
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to fetch token.";
      return NextResponse.json({ error: message }, { status: 502 });
    }

    const redirectUri = `${appUrl}/powens/callback`;
    const paymentPayload = {
      client_redirect_uri: redirectUri,
      client_state: order.id,
      instructions: [
        {
          amount: Number(Number(order.total ?? 0).toFixed(2)),
          currency: order.currency ?? "EUR",
          label: `Cityzeen order ${order.id}`,
          execution_date_type: "first_open_day",
          beneficiary: {
            scheme_name: "iban",
            identification: beneficiaryIban,
            label: beneficiaryLabel,
          },
        },
      ],
    };

    const paymentRes = await fetch(`${powensBaseUrl}/payments`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${powensAdminToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(paymentPayload),
    });
    const paymentRaw = await paymentRes.text();
    const paymentData = (() => {
      try {
        return JSON.parse(paymentRaw) as PowensPaymentResponse;
      } catch {
        return { message: paymentRaw } as PowensPaymentResponse;
      }
    })();
    if (!paymentRes.ok || !paymentData.id) {
      console.error("[powens] create payment failed", {
        status: paymentRes.status,
        body: paymentRaw,
      });
      return NextResponse.json(
        {
          error:
            paymentData.error ||
            paymentData.message ||
            "Failed to create payment.",
        },
        { status: 502 },
      );
    }

    const paymentId = String(paymentData.id);
    await updateOrderPayment(
      order.id,
      paymentId,
      paymentData.state ?? "created",
      token,
    );

    let powensPaymentToken = "";
    try {
      powensPaymentToken = await getPowensPaymentScopedToken(
        powensBaseUrl,
        paymentId,
        powensAdminToken,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to fetch payment token.";
      return NextResponse.json({ error: message }, { status: 502 });
    }

    const webviewUrl = new URL(`${powensBaseUrl}/auth/webview/payment`);
    webviewUrl.searchParams.set("payment_id", paymentId);
    webviewUrl.searchParams.set("client_id", powensClientId);
    webviewUrl.searchParams.set("code", powensPaymentToken);

    return NextResponse.json({
      redirectUrl: webviewUrl.toString(),
      paymentId,
    });
  } catch (error) {
    console.error("[powens] create-payment failed", error);
    return NextResponse.json(
      { error: "Failed to create payment." },
      { status: 500 },
    );
  }
}
