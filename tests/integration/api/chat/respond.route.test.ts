// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const { respondToLatestUserMessage, verifyAccessToken } = vi.hoisted(() => ({
  respondToLatestUserMessage: vi.fn(),
  verifyAccessToken: vi.fn(),
}));

vi.mock("@/src/application/use-cases/chatService", () => ({
  ChatService: class {
    respondToLatestUserMessage = respondToLatestUserMessage;
  },
}));
vi.mock("@/src/infrastructure/repositories/amplifyChatRepository", () => ({ AmplifyChatRepository: class {} }));
vi.mock("@/src/infrastructure/gateways/ruleBasedChatGateway", () => ({ RuleBasedChatGateway: class {} }));
vi.mock("@/src/infrastructure/auth/verifyAccessToken", () => ({ verifyAccessToken }));

import { POST } from "@/app/api/chat/respond/route";

describe("POST /api/chat/respond", () => {
  beforeEach(() => {
    verifyAccessToken.mockReset().mockResolvedValue({ sub: "user-1" });
    respondToLatestUserMessage.mockReset().mockResolvedValue({
      answer: "Generated answer",
      thread: {
        threadId: "thread-1",
        userId: "user-1",
        lastMessageAt: "2026-03-25T10:00:00.000Z",
        lastMessageText: "Generated answer",
      },
      message: {
        id: "assistant-1",
        threadId: "thread-1",
        userId: "user-1",
        role: "assistant",
        text: "Generated answer",
        createdAt: "2026-03-25T10:00:00.000Z",
      },
    });
  });

  it("returns 400 when required input is missing", async () => {
    const response = await POST(
      new Request("http://localhost/api/chat/respond", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer token",
        },
        body: JSON.stringify({ threadId: "", userId: "user-1", input: "hi" }),
      }),
    );

    expect(response.status).toBe(400);
  });

  it("returns 401 when bearer token is missing", async () => {
    const response = await POST(
      new Request("http://localhost/api/chat/respond", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ threadId: "thread-1", userId: "user-1", input: "hi" }),
      }),
    );

    expect(response.status).toBe(401);
  });

  it("returns 403 when bearer token belongs to another user", async () => {
    verifyAccessToken.mockResolvedValue({ sub: "other-user" });
    const response = await POST(
      new Request("http://localhost/api/chat/respond", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer token",
        },
        body: JSON.stringify({ threadId: "thread-1", userId: "user-1", input: "hi" }),
      }),
    );

    expect(response.status).toBe(403);
  });

  it("returns answer, thread and messageId on success", async () => {
    const response = await POST(
      new Request("http://localhost/api/chat/respond", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer token",
        },
        body: JSON.stringify({ threadId: "thread-1", userId: "user-1", input: "hi" }),
      }),
    );

    expect(respondToLatestUserMessage).toHaveBeenCalledWith({
      userId: "user-1",
      threadId: "thread-1",
      text: "hi",
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      answer: "Generated answer",
      thread: {
        threadId: "thread-1",
        userId: "user-1",
        lastMessageAt: "2026-03-25T10:00:00.000Z",
        lastMessageText: "Generated answer",
      },
      messageId: "assistant-1",
    });
  });
});
