import { decodeProtectedHeader, importJWK, jwtVerify, type JWTPayload } from "jose";

import outputs from "@/amplify_outputs.json";

const REGION = outputs.auth?.aws_region || "eu-central-1";
const USER_POOL_ID = outputs.auth?.user_pool_id || "";
const CLIENT_ID = outputs.auth?.user_pool_client_id || "";
const JWKS_URI = USER_POOL_ID
  ? `https://cognito-idp.${REGION}.amazonaws.com/${USER_POOL_ID}/.well-known/jwks.json`
  : "";

let jwksCache:
  | { jwks: Record<string, unknown>[]; fetchedAt: number }
  | null = null;
const JWKS_TTL_MS = 10 * 60 * 1000;

async function getJwks() {
  if (!JWKS_URI) {
    throw new Error("Missing Cognito JWKS URI.");
  }

  const now = Date.now();
  if (jwksCache && now - jwksCache.fetchedAt < JWKS_TTL_MS) {
    return jwksCache.jwks;
  }

  const response = await fetch(JWKS_URI);
  if (!response.ok) {
    throw new Error("Failed to fetch JWKS.");
  }

  const data = (await response.json()) as { keys: Record<string, unknown>[] };
  jwksCache = { jwks: data.keys ?? [], fetchedAt: now };
  return jwksCache.jwks;
}

export async function verifyAccessToken(token: string): Promise<JWTPayload> {
  if (!USER_POOL_ID || !CLIENT_ID) {
    throw new Error("Missing Cognito configuration.");
  }

  const header = decodeProtectedHeader(token);
  if (!header.kid) {
    throw new Error("Missing kid.");
  }

  const jwks = await getJwks();
  const jwk = jwks.find((key) => key.kid === header.kid);
  if (!jwk) {
    throw new Error("JWKS kid not found.");
  }

  const key = await importJWK(jwk, header.alg as string | undefined);
  const issuer = `https://cognito-idp.${REGION}.amazonaws.com/${USER_POOL_ID}`;
  const { payload } = await jwtVerify(token, key, { issuer });
  const tokenUse = payload.token_use as string | undefined;
  const clientId = payload.client_id as string | undefined;

  if (tokenUse !== "access") {
    throw new Error("Invalid token_use.");
  }

  if (!clientId || clientId !== CLIENT_ID) {
    throw new Error("Invalid client_id.");
  }

  return payload as JWTPayload;
}
