import type { ChatGateway, ChatRepository } from "@/src/application/chatPorts";
import type { ChatMessage, ChatThreadSummary } from "@/src/domain/chat";

export interface ChatIdGenerator {
  next(): string;
}

export interface ChatClock {
  now(): string;
}

export class ChatService {
  constructor(
    private readonly repository: ChatRepository,
    private readonly gateway: ChatGateway,
    private readonly idGenerator: ChatIdGenerator,
    private readonly clock: ChatClock,
  ) {}

  async sendMessage(input: {
    userId: string;
    threadId: string;
    text: string;
  }): Promise<{ answer: string; thread: ChatThreadSummary; messages: ChatMessage[] }> {
    const now = this.clock.now();
    const existingMessages = await this.repository.listMessagesByThread(input.userId, input.threadId);

    const userMessage = await this.repository.createMessage({
      id: this.idGenerator.next(),
      threadId: input.threadId,
      userId: input.userId,
      role: "user",
      text: input.text,
      createdAt: now,
    });

    const answer = await this.gateway.reply({
      userId: input.userId,
      threadId: input.threadId,
      message: input.text,
      history: [...existingMessages, userMessage].slice(-8),
    });

    const assistantMessage = await this.repository.createMessage({
      id: this.idGenerator.next(),
      threadId: input.threadId,
      userId: input.userId,
      role: "assistant",
      text: answer,
      createdAt: this.clock.now(),
    });

    const thread: ChatThreadSummary = {
      threadId: input.threadId,
      userId: input.userId,
      lastMessageAt: assistantMessage.createdAt,
      lastMessageText: assistantMessage.text,
    };
    await this.repository.saveThread(thread);

    return {
      answer,
      thread,
      messages: [userMessage, assistantMessage],
    };
  }

  async listThreads(userId: string): Promise<ChatThreadSummary[]> {
    return this.repository.listThreadsByUser(userId);
  }

  async listMessages(userId: string, threadId: string): Promise<ChatMessage[]> {
    return this.repository.listMessagesByThread(userId, threadId);
  }
}
