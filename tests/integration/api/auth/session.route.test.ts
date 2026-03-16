// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const { fetchAuthSession, ensureAmplifyConfigured } = vi.hoisted(() => ({
  fetchAuthSession: vi.fn(),
  ensureAmplifyConfigured: vi.fn(),
}));

vi.mock("aws-amplify/auth", () => ({ fetchAuthSession }));
vi.mock("@/src/config/amplify", () => ({ ensureAmplifyConfigured }));

import { GET } from "@/app/api/auth/session/route";

describe("GET /api/auth/session", () => {
  beforeEach(() => {
    fetchAuthSession.mockReset();
    ensureAmplifyConfigured.mockReset();
  });

  it("returns the access token when session fetch succeeds", async () => {
    fetchAuthSession.mockResolvedValue({
      tokens: {
        accessToken: { toString: () => "access-token" },
      },
    });

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ accessToken: "access-token" });
  });

  it("returns 401 with null access token when session fetch fails", async () => {
    fetchAuthSession.mockRejectedValue(new Error("no session"));

    const response = await GET();

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ accessToken: null });
  });
});