import { generateClient } from "aws-amplify/data";
import { NextResponse } from "next/server";

import type { Schema } from "@/amplify/data/resource";
import {
  buildAnonCookieValue,
  getAnonCookieMaxAge,
  getAnonCookieName,
} from "@/src/infrastructure/auth/anonSession";
import { ensureAmplifyConfigured } from "@/src/infrastructure/amplify/config";
import { getNodeEnv } from "@/src/infrastructure/config/runtimeEnv";

export const runtime = "nodejs";

const getClient = () => {
  ensureAmplifyConfigured();
  return generateClient<Schema>();
};

export async function POST() {
  try {
    const anonUserId = `anon-${crypto.randomUUID()}`;
    const now = new Date().toISOString();
    const client = getClient();
    await client.models.UserProfile.create({
      id: anonUserId,
      email: "",
      role: "INVESTOR",
      country: "Unknown",
      kycStatus: "NOT_STARTED",
      createdAt: now,
      updatedAt: now,
    });

    const issuedAt = Date.now();
    const cookieValue = buildAnonCookieValue(anonUserId, issuedAt);
    const response = NextResponse.json({ userId: anonUserId });
    response.cookies.set(getAnonCookieName(), cookieValue, {
      httpOnly: true,
      sameSite: "lax",
      secure: getNodeEnv() === "production",
      path: "/",
      maxAge: getAnonCookieMaxAge(),
    });
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
