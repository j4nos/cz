// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const verifyAccessToken = vi.fn();
const ensureAmplifyConfigured = vi.fn();
const generateClient = vi.fn();
const sendMock = vi.fn();

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
  vi.doMock("@/src/config/amplify", () => ({ ensureAmplifyConfigured }));
  vi.doMock("aws-amplify/data", () => ({ generateClient }));
  vi.doMock("@aws-sdk/client-cognito-identity-provider", () => ({
    CognitoIdentityProviderClient: class {
      send = sendMock;
    },
    AdminDeleteUserCommand: class {
      constructor(public readonly input: unknown) {}
    },
  }));

  return import("@/app/api/account/delete/route");
}

describe("POST /api/account/delete", () => {
  beforeEach(() => {
    verifyAccessToken.mockReset().mockResolvedValue({ sub: "user-1", email: "user@example.com" });
    ensureAmplifyConfigured.mockReset();
    generateClient.mockReset().mockReturnValue({ models: { UserProfile: { delete: vi.fn().mockResolvedValue({}) } } });
    sendMock.mockReset().mockResolvedValue({});
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

  it("deletes the user by user id when possible", async () => {
    const client = { models: { UserProfile: { delete: vi.fn().mockResolvedValue({}) } } };
    generateClient.mockReturnValue(client);
    const { POST } = await loadRoute("pool-1");
    const response = await POST(makeRequest());

    expect(response.status).toBe(200);
    expect(client.models.UserProfile.delete).toHaveBeenCalledWith({ id: "user-1" });
    expect(sendMock).toHaveBeenCalledTimes(1);
    await expect(response.json()).resolves.toEqual({ status: "deleted" });
  });

  it("falls back to deleting by email when the user id deletion fails", async () => {
    sendMock.mockRejectedValueOnce(new Error("not found")).mockResolvedValueOnce({});
    const { POST } = await loadRoute("pool-1");
    const response = await POST(makeRequest());

    expect(response.status).toBe(200);
    expect(sendMock).toHaveBeenCalledTimes(2);
  });

  it("returns 500 when both delete attempts fail", async () => {
    sendMock.mockRejectedValue(new Error("boom"));
    const { POST } = await loadRoute("pool-1");
    const response = await POST(makeRequest());

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "Delete failed." });
  });
});