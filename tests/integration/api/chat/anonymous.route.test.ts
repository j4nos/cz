// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const { generateClient, ensureAmplifyConfigured } = vi.hoisted(() => ({
  generateClient: vi.fn(),
  ensureAmplifyConfigured: vi.fn(),
}));

vi.mock("aws-amplify/data", () => ({ generateClient }));
vi.mock("@/src/config/amplify", () => ({ ensureAmplifyConfigured }));
vi.mock("@/src/infrastructure/auth/anonSession", () => ({
  buildAnonCookieValue: (userId: string, issuedAt: number) => `${userId}.${issuedAt}`,
  getAnonCookieMaxAge: () => 3600,
  getAnonCookieName: () => "cityzeen-anon",
}));
vi.mock("@/src/config/runtimeEnv", () => ({ getNodeEnv: () => "test" }));

import { POST } from "@/app/api/chat/anonymous/route";

describe("POST /api/chat/anonymous", () => {
  beforeEach(() => {
    generateClient.mockReset().mockReturnValue({
      models: {
        UserProfile: {
          create: vi.fn().mockResolvedValue({}),
        },
      },
    });
    ensureAmplifyConfigured.mockReset();
  });

  it("creates an anonymous user and sets an httpOnly cookie", async () => {
    const response = await POST();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.userId).toMatch(/^anon-/);
    expect(response.headers.get("set-cookie")).toContain("cityzeen-anon=");
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
  });

  it("returns 500 when profile creation fails", async () => {
    generateClient.mockReturnValue({
      models: {
        UserProfile: {
          create: vi.fn().mockRejectedValue(new Error("create failed")),
        },
      },
    });

    const response = await POST();

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "create failed" });
  });
});