import type { ChatMessage, ChatThreadSummary } from "@/src/domain/entities/chat";
import type { ChatPanelPort } from "@/src/application/interfaces/chatPanelPort";

export class ChatPanelService {
  constructor(private readonly client: ChatPanelPort) {}

  listThreads(userId: string): Promise<ChatThreadSummary[]> {
    return this.client.listThreads(userId);
  }

  listMessages(userId: string, threadId: string): Promise<ChatMessage[]> {
    return this.client.listMessages(userId, threadId);
  }

  createUserMessage(input: ChatMessage): Promise<void> {
    return this.client.createUserMessage(input);
  }

  saveThread(input: ChatThreadSummary): Promise<void> {
    return this.client.saveThread(input);
  }

  respond(input: {
    accessToken: string;
    threadId: string;
    text: string;
    userId: string;
  }): Promise<{ answer?: string; thread?: ChatThreadSummary; messageId?: string }> {
    return this.client.respond(input);
  }

  subscribeToThreads(userId: string, handler: (thread: ChatThreadSummary) => void): () => void {
    return this.client.subscribeToThreads(userId, handler);
  }

  subscribeToMessages(
    userId: string,
    threadId: string,
    handler: (message: ChatMessage) => void,
  ): () => void {
    return this.client.subscribeToMessages(userId, threadId, handler);
  }
}
