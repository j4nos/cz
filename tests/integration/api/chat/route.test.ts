// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const { sendMessage, listThreads, listMessages } = vi.hoisted(() => ({
  sendMessage: vi.fn(),
  listThreads: vi.fn(),
  listMessages: vi.fn(),
}));

vi.mock("@/src/application/use-cases/chatService", () => ({
  ChatService: class {
    sendMessage = sendMessage;
    listThreads = listThreads;
    listMessages = listMessages;
  },
}));
vi.mock("@/src/infrastructure/repositories/amplifyChatRepository", () => ({ AmplifyChatRepository: class {} }));
vi.mock("@/src/infrastructure/gateways/ruleBasedChatGateway", () => ({ RuleBasedChatGateway: class {} }));

import { GET, POST } from "@/app/api/chat/route";

describe("/api/chat route", () => {
  beforeEach(() => {
    sendMessage.mockReset().mockResolvedValue({
      answer: "Generated answer",
      messages: [{ id: "m1" }, { id: "m2" }],
      thread: { threadId: "thread-1", userId: "user-1" },
    });
    listThreads.mockReset().mockResolvedValue([{ threadId: "thread-1", userId: "user-1" }]);
    listMessages.mockReset().mockResolvedValue([{ id: "m1", threadId: "thread-1" }]);
  });

  it("returns 400 for missing POST input", async () => {
    const response = await POST(
      new Request("http://localhost/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ threadId: "", userId: "user-1", input: "hi" }),
      }),
    );
    expect(response.status).toBe(400);
  });

  it("returns answer, messageIds and thread for successful POST", async () => {
    const response = await POST(
      new Request("http://localhost/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ threadId: "thread-1", userId: "user-1", input: "hi" }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      answer: "Generated answer",
      messageIds: ["m1", "m2"],
      thread: { threadId: "thread-1", userId: "user-1" },
    });
  });

  it("returns 400 for thread listing without userId", async () => {
    const response = await GET(new Request("http://localhost/api/chat?listThreads=1"));
    expect(response.status).toBe(400);
  });

  it("returns threads for listThreads=1", async () => {
    const response = await GET(new Request("http://localhost/api/chat?userId=user-1&listThreads=1"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ threads: [{ threadId: "thread-1", userId: "user-1" }] });
  });

  it("returns messages for thread lookup", async () => {
    const response = await GET(new Request("http://localhost/api/chat?userId=user-1&threadId=thread-1"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ messages: [{ id: "m1", threadId: "thread-1" }] });
  });
});