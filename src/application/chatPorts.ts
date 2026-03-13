import type { ChatMessage, ChatThreadSummary } from "@/src/domain/chat";

export interface ChatRepository {
  getThread(threadId: string): Promise<ChatThreadSummary | null>;
  saveThread(input: ChatThreadSummary): Promise<void>;
  listThreadsByUser(userId: string): Promise<ChatThreadSummary[]>;
  createMessage(input: ChatMessage): Promise<ChatMessage>;
  listMessagesByThread(userId: string, threadId: string): Promise<ChatMessage[]>;
}

export interface ChatGateway {
  reply(input: {
    userId: string;
    threadId: string;
    message: string;
    history: ChatMessage[];
  }): Promise<string>;
}
