import { verifyAccessToken } from "@/src/infrastructure/auth/verifyAccessToken";

export const getBearerToken = (request: Request): string => {
  const authHeader = request.headers.get("authorization") || "";
  return authHeader.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : "";
};

export async function authorizeUserRequest(request: Request, requestedUserId: string) {
  const token = getBearerToken(request);
  if (!token) {
    return { ok: false as const, status: 401, error: "Missing bearer token." };
  }

  try {
    const payload = await verifyAccessToken(token);
    const tokenUserId = payload.sub as string | undefined;
    if (!tokenUserId || tokenUserId !== requestedUserId) {
      return { ok: false as const, status: 403, error: "Forbidden." };
    }
    return { ok: true as const };
  } catch {
    return { ok: false as const, status: 401, error: "Invalid bearer token." };
  }
}
