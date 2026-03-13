import { describe, expect, it } from "vitest";

import type { ChatGateway, ChatRepository } from "@/src/application/chatPorts";
import { ChatService } from "@/src/application/chatService";
import type { ChatMessage, ChatThreadSummary } from "@/src/domain/chat";

class FakeChatRepository implements ChatRepository {
  readonly threads = new Map<string, ChatThreadSummary>();
  readonly messages: ChatMessage[] = [];

  async getThread(threadId: string): Promise<ChatThreadSummary | null> {
    return this.threads.get(threadId) ?? null;
  }

  async saveThread(input: ChatThreadSummary): Promise<void> {
    this.threads.set(input.threadId, input);
  }

  async listThreadsByUser(userId: string): Promise<ChatThreadSummary[]> {
    return Array.from(this.threads.values()).filter((thread) => thread.userId === userId);
  }

  async createMessage(input: ChatMessage): Promise<ChatMessage> {
    this.messages.push(input);
    return input;
  }

  async listMessagesByThread(userId: string, threadId: string): Promise<ChatMessage[]> {
    return this.messages.filter((message) => message.userId === userId && message.threadId === threadId);
  }
}

class FakeChatGateway implements ChatGateway {
  async reply(): Promise<string> {
    return "Generated answer";
  }
}

class FixedIdGenerator {
  private current = 1;

  next(): string {
    return `chat-${this.current++}`;
  }
}

class FixedClock {
  now(): string {
    return "2026-03-13T10:00:00.000Z";
  }
}

describe("ChatService", () => {
  it("stores user and assistant messages and updates the thread summary", async () => {
    const repository = new FakeChatRepository();
    const service = new ChatService(
      repository,
      new FakeChatGateway(),
      new FixedIdGenerator(),
      new FixedClock(),
    );

    const result = await service.sendMessage({
      userId: "investor-1",
      threadId: "thread-1",
      text: "Show me listings",
    });

    expect(result.answer).toBe("Generated answer");
    expect(result.messages).toHaveLength(2);
    expect(result.messages[0].role).toBe("user");
    expect(result.messages[1].role).toBe("assistant");
    expect(repository.threads.get("thread-1")?.lastMessageText).toBe("Generated answer");
  });
});
