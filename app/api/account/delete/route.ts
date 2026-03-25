import { NextResponse } from "next/server";

import outputs from "@/amplify_outputs.json";
import { verifyAccessToken } from "@/src/infrastructure/auth/verifyAccessToken";
import { createDeleteAccountService } from "@/src/infrastructure/composition/defaults";

const REGION = outputs.auth?.aws_region || "eu-central-1";
const USER_POOL_ID = outputs.auth?.user_pool_id || "";

export async function POST(request: Request) {
  if (!USER_POOL_ID) {
    return NextResponse.json(
      { error: "Missing Cognito user pool configuration." },
      { status: 500 }
    );
  }

  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : "";
  if (!token) {
    return NextResponse.json({ error: "Missing bearer token." }, { status: 401 });
  }

  try {
    const payload = await verifyAccessToken(token);
    const userId = payload.sub as string | undefined;
    const email = payload.email as string | undefined;
    if (!userId) {
      return NextResponse.json({ error: "Invalid token." }, { status: 401 });
    }

    await createDeleteAccountService(token).deleteAccount({
      userId,
      email,
      userPoolId: USER_POOL_ID,
      region: REGION,
    });

    return NextResponse.json({ status: "deleted" });
  } catch (error) {
    console.error("[account-delete] failed", error);
    return NextResponse.json({ error: "Delete failed." }, { status: 500 });
  }
}
