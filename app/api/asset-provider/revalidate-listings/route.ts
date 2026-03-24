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

    const body = (await request.json().catch(() => ({}))) as {
      listingId?: string;
      listingIds?: string[];
    };
    revalidatePath("/listings");
    const listingIds = [
      ...(body.listingId ? [body.listingId] : []),
      ...((body.listingIds ?? []).filter(Boolean)),
    ];
    for (const listingId of listingIds.filter((listingId, index, all) => all.indexOf(listingId) === index)) {
      revalidatePath(`/listings/${listingId}`);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to revalidate listings.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
