import { NextResponse } from "next/server";
import {
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  CognitoIdentityProviderClient,
} from "@aws-sdk/client-cognito-identity-provider";

import outputs from "@/amplify_outputs.json";

export const runtime = "nodejs";

const userPoolId = outputs.auth?.user_pool_id;
const region = outputs.auth?.aws_region;

const cognito = region
  ? new CognitoIdentityProviderClient({ region })
  : null;

function buildGuestEmail() {
  return `guest+${crypto.randomUUID()}@guest.cityzeen.local`;
}

function buildGuestPassword() {
  const base = crypto.randomUUID().replace(/-/g, "");
  return `Gst!${base}9aA`;
}

export async function POST() {
  try {
    if (!cognito || !userPoolId) {
      return NextResponse.json({ error: "Cognito configuration is missing." }, { status: 500 });
    }

    const email = buildGuestEmail();
    const password = buildGuestPassword();

    await cognito.send(
      new AdminCreateUserCommand({
        UserPoolId: userPoolId,
        Username: email,
        MessageAction: "SUPPRESS",
        UserAttributes: [
          { Name: "email", Value: email },
          { Name: "email_verified", Value: "true" },
        ],
      }),
    );

    await cognito.send(
      new AdminSetUserPasswordCommand({
        UserPoolId: userPoolId,
        Username: email,
        Password: password,
        Permanent: true,
      }),
    );

    return NextResponse.json({ email, password });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
