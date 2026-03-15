import { NextResponse } from "next/server";
import { fetchAuthSession } from "aws-amplify/auth";

import { ensureAmplifyConfigured } from "@/src/config/amplify";

export async function GET() {
  try {
    ensureAmplifyConfigured();
    const session = await fetchAuthSession();
    const tokens = session.tokens;
    const accessToken = tokens?.accessToken?.toString();
    return NextResponse.json({ accessToken });
  } catch {
    return NextResponse.json({ accessToken: null }, { status: 401 });
  }
}
