import { CognitoIdentityProviderClient, AdminDeleteUserCommand } from "@aws-sdk/client-cognito-identity-provider";
import { generateClient } from "aws-amplify/data";
import { NextResponse } from "next/server";

import outputs from "@/amplify_outputs.json";
import type { Schema } from "@/amplify/data/resource";
import { ensureAmplifyConfigured } from "@/src/config/amplify";
import { verifyAccessToken } from "@/src/infrastructure/auth/verifyAccessToken";

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

    ensureAmplifyConfigured();
    const client = generateClient<Schema>();
    await client.models.UserProfile.delete({ id: userId });

    const cognito = new CognitoIdentityProviderClient({ region: REGION });
    const tryDelete = async (username: string) => {
      const command = new AdminDeleteUserCommand({
        UserPoolId: USER_POOL_ID,
        Username: username,
      });
      await cognito.send(command);
    };

    try {
      await tryDelete(userId);
    } catch (error) {
      if (email) {
        await tryDelete(email);
      } else {
        throw error;
      }
    }

    return NextResponse.json({ status: "deleted" });
  } catch (error) {
    console.error("[account-delete] failed", error);
    return NextResponse.json({ error: "Delete failed." }, { status: 500 });
  }
}
