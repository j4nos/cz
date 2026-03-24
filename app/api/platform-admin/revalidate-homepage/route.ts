import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { verifyAccessToken } from "@/src/infrastructure/auth/verifyAccessToken";

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      return NextResponse.json({ message: "Missing access token." }, { status: 401 });
    }

    await verifyAccessToken(token);
    revalidatePath("/");

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to revalidate homepage.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
