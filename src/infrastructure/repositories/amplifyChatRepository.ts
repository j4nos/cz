import { generateClient } from "aws-amplify/data";

import type { Schema } from "@/amplify/data/resource";
import type { ChatRepository } from "@/src/application/chatPorts";
import type { ChatMessage, ChatThreadSummary } from "@/src/domain/chat";
import { ensureAmplifyConfigured } from "@/src/infrastructure/amplify/config";
import { listAll } from "@/src/infrastructure/amplify/pagination";

export class AmplifyChatRepository implements ChatRepository {
  private readonly client;

  constructor() {
    ensureAmplifyConfigured();
    this.client = generateClient<Schema>();
  }

  async getThread(threadId: string): Promise<ChatThreadSummary | null> {
    const response = await this.client.models.UserThread.get({ id: threadId });
    if (!response.data) {
      return null;
    }

    return {
      threadId: response.data.id,
      userId: response.data.userId ?? "",
      lastMessageAt: response.data.lastMessageAt ?? "",
      lastMessageText: response.data.lastMessageText ?? "",
      state: response.data.state ?? undefined,
    };
  }

  async saveThread(input: ChatThreadSummary): Promise<void> {
    const existing = await this.getThread(input.threadId);
    if (existing) {
      await this.client.models.UserThread.update({
        id: input.threadId,
        userId: input.userId,
        lastMessageAt: input.lastMessageAt,
        lastMessageText: input.lastMessageText,
        state: input.state,
      });
      return;
    }

    await this.client.models.UserThread.create({
      id: input.threadId,
      userId: input.userId,
      lastMessageAt: input.lastMessageAt,
      lastMessageText: input.lastMessageText,
      state: input.state ?? "{}",
    });
  }

  async listThreadsByUser(userId: string): Promise<ChatThreadSummary[]> {
    const items = await listAll<Schema["UserThread"]["type"], { nextToken?: string }>((args) =>
      this.client.models.UserThread.list({
        filter: { userId: { eq: userId } },
        ...(args ?? {}),
      })
    );

    return items
      .map((item) => ({
        threadId: item.id,
        userId: item.userId ?? "",
        lastMessageAt: item.lastMessageAt ?? "",
        lastMessageText: item.lastMessageText ?? "",
        state: item.state ?? undefined,
      }))
      .sort((left, right) => right.lastMessageAt.localeCompare(left.lastMessageAt));
  }

  async createMessage(input: ChatMessage): Promise<ChatMessage> {
    const response = await this.client.models.UserMessage.create({
      id: input.id,
      threadId: input.threadId,
      userId: input.userId,
      role: input.role,
      text: input.text,
      createdAt: input.createdAt,
    });

    return {
      id: response.data?.id ?? input.id,
      threadId: response.data?.threadId ?? input.threadId,
      userId: response.data?.userId ?? input.userId,
      role: (response.data?.role as ChatMessage["role"]) ?? input.role,
      text: response.data?.text ?? input.text,
      createdAt: response.data?.createdAt ?? input.createdAt,
    };
  }

  async listMessagesByThread(userId: string, threadId: string): Promise<ChatMessage[]> {
    const items = await listAll<Schema["UserMessage"]["type"], { nextToken?: string }>((args) =>
      this.client.models.UserMessage.list({
        filter: {
          threadId: { eq: threadId },
          userId: { eq: userId },
        },
        ...(args ?? {}),
      })
    );

    return items
      .map((item) => ({
        id: item.id,
        threadId: item.threadId ?? "",
        userId: item.userId ?? "",
        role: (item.role as ChatMessage["role"]) ?? "user",
        text: item.text ?? "",
        createdAt: item.createdAt ?? "",
      }))
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt));
  }
}
