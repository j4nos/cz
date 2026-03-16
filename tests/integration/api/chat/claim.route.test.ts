// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  generateClient,
  ensureAmplifyConfigured,
  verifyAccessToken,
  listAll,
  parseAnonCookieValue,
  threadUpdate,
  messageUpdate,
  profileDelete,
} = vi.hoisted(() => ({
  generateClient: vi.fn(),
  ensureAmplifyConfigured: vi.fn(),
  verifyAccessToken: vi.fn(),
  listAll: vi.fn(),
  parseAnonCookieValue: vi.fn(),
  threadUpdate: vi.fn(),
  messageUpdate: vi.fn(),
  profileDelete: vi.fn(),
}));

vi.mock("aws-amplify/data", () => ({ generateClient }));
vi.mock("@/src/config/amplify", () => ({ ensureAmplifyConfigured }));
vi.mock("@/src/infrastructure/auth/verifyAccessToken", () => ({ verifyAccessToken }));
vi.mock("@/src/infrastructure/amplify/pagination", () => ({ listAll }));
vi.mock("@/src/infrastructure/auth/anonSession", () => ({
  getAnonCookieName: () => "cityzeen-anon",
  parseAnonCookieValue,
}));
vi.mock("@/src/config/runtimeEnv", () => ({ getNodeEnv: () => "test" }));

import { POST } from "@/app/api/chat/claim/route";

const makeRequest = (body: Record<string, unknown>, options?: { withBearer?: boolean; cookie?: string }) =>
  new Request("http://localhost/api/chat/claim", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(options?.withBearer === false ? {} : { authorization: "Bearer token" }),
      ...(options?.cookie ? { cookie: options.cookie } : {}),
    },
    body: JSON.stringify(body),
  });

describe("POST /api/chat/claim", () => {
  beforeEach(() => {
    generateClient.mockReset().mockReturnValue({
      models: {
        UserThread: { list: vi.fn(), update: threadUpdate },
        UserMessage: { list: vi.fn(), update: messageUpdate },
        UserProfile: { delete: profileDelete },
      },
    });
    ensureAmplifyConfigured.mockReset();
    verifyAccessToken.mockReset().mockResolvedValue({ sub: "user-1" });
    listAll.mockReset().mockResolvedValueOnce([{ id: "thread-1", userId: "anon-1", lastMessageAt: "now" }]).mockResolvedValueOnce([
      { id: "message-1", userId: "anon-1", threadId: "thread-1", role: "user", text: "hi", createdAt: "now" },
    ]);
    parseAnonCookieValue.mockReset().mockReturnValue({ userId: "anon-1" });
    threadUpdate.mockReset().mockResolvedValue({});
    messageUpdate.mockReset().mockResolvedValue({});
    profileDelete.mockReset().mockResolvedValue({});
  });

  it("returns 400 when toUserId is missing", async () => {
    const response = await POST(makeRequest({}, { cookie: "cityzeen-anon=value" }));
    expect(response.status).toBe(400);
  });

  it("returns 401 when bearer token is missing", async () => {
    const response = await POST(makeRequest({ toUserId: "user-1" }, { withBearer: false, cookie: "cityzeen-anon=value" }));
    expect(response.status).toBe(401);
  });

  it("returns 403 when the token user does not match toUserId", async () => {
    verifyAccessToken.mockResolvedValue({ sub: "other" });
    const response = await POST(makeRequest({ toUserId: "user-1" }, { cookie: "cityzeen-anon=value" }));
    expect(response.status).toBe(403);
  });

  it("returns 401 when the anonymous cookie is missing", async () => {
    const response = await POST(makeRequest({ toUserId: "user-1" }));
    expect(response.status).toBe(401);
  });

  it("returns 401 when the anonymous cookie is invalid", async () => {
    parseAnonCookieValue.mockReturnValue(null);
    const response = await POST(makeRequest({ toUserId: "user-1" }, { cookie: "cityzeen-anon=bad" }));
    expect(response.status).toBe(401);
  });

  it("returns migrated false and clears the cookie when source and target users match", async () => {
    parseAnonCookieValue.mockReturnValue({ userId: "user-1" });
    const response = await POST(makeRequest({ toUserId: "user-1" }, { cookie: "cityzeen-anon=value" }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ migrated: false });
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
  });

  it("migrates threads and messages, deletes the profile and clears the cookie", async () => {
    const response = await POST(makeRequest({ toUserId: "user-1" }, { cookie: "cityzeen-anon=value" }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ migrated: true, threads: 1, messages: 1 });
    expect(threadUpdate).toHaveBeenCalledWith(expect.objectContaining({ id: "thread-1", userId: "user-1" }));
    expect(messageUpdate).toHaveBeenCalledWith(expect.objectContaining({ id: "message-1", userId: "user-1" }));
    expect(profileDelete).toHaveBeenCalledWith({ id: "anon-1" });
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
  });

  it("returns 500 when a batch update keeps failing", async () => {
    threadUpdate.mockRejectedValue(new Error("update failed"));
    const response = await POST(makeRequest({ toUserId: "user-1" }, { cookie: "cityzeen-anon=value" }));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "Batch update failed for 1 items." });
  });
});