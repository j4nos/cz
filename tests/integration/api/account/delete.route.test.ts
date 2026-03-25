// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const verifyAccessToken = vi.fn();
const deleteAccount = vi.fn();

const makeRequest = (withBearer = true) =>
  new Request("http://localhost/api/account/delete", {
    method: "POST",
    headers: withBearer ? { authorization: "Bearer token" } : {},
  });

async function loadRoute(userPoolId: string) {
  vi.resetModules();
  vi.doMock("@/amplify_outputs.json", () => ({
    default: {
      auth: {
        aws_region: "eu-central-1",
        user_pool_id: userPoolId,
      },
    },
  }));
  vi.doMock("@/src/infrastructure/auth/verifyAccessToken", () => ({ verifyAccessToken }));
  vi.doMock("@/src/infrastructure/composition/defaults", () => ({
    createDeleteAccountService: () => ({
      deleteAccount,
    }),
  }));

  return import("@/app/api/account/delete/route");
}

describe("POST /api/account/delete", () => {
  beforeEach(() => {
    verifyAccessToken.mockReset().mockResolvedValue({ sub: "user-1", email: "user@example.com" });
    deleteAccount.mockReset().mockResolvedValue(undefined);
  });

  it("returns 500 when the user pool config is missing", async () => {
    const { POST } = await loadRoute("");
    const response = await POST(makeRequest());

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "Missing Cognito user pool configuration." });
  });

  it("returns 401 when bearer token is missing", async () => {
    const { POST } = await loadRoute("pool-1");
    const response = await POST(makeRequest(false));

    expect(response.status).toBe(401);
  });

  it("returns 401 when token is invalid", async () => {
    verifyAccessToken.mockResolvedValue({});
    const { POST } = await loadRoute("pool-1");
    const response = await POST(makeRequest());

    expect(response.status).toBe(401);
  });

  it("delegates deletion to the backend service", async () => {
    const { POST } = await loadRoute("pool-1");
    const response = await POST(makeRequest());

    expect(response.status).toBe(200);
    expect(deleteAccount).toHaveBeenCalledWith({
      userId: "user-1",
      email: "user@example.com",
      userPoolId: "pool-1",
      region: "eu-central-1",
    });
    await expect(response.json()).resolves.toEqual({ status: "deleted" });
  });

  it("returns 500 when the backend service fails", async () => {
    deleteAccount.mockRejectedValue(new Error("boom"));
    const { POST } = await loadRoute("pool-1");
    const response = await POST(makeRequest());

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "Delete failed." });
  });
});
