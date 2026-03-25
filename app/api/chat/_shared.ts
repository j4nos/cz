import { NextResponse } from "next/server";

export { createChatService } from "@/src/infrastructure/composition/chat";
import { authorizeUserRequest, getBearerToken } from "@/src/infrastructure/http/authorizeUserRequest";

export async function authorizeChatRequest(request: Request, requestedUserId: string) {
  const auth = await authorizeUserRequest(request, requestedUserId);
  if (!auth.ok) {
    return auth;
  }

  return {
    ...auth,
    token: getBearerToken(request),
    userId: requestedUserId,
  };
}

export function mapChatRouteError(error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown error";
  return NextResponse.json({ error: message }, { status: 500 });
}
