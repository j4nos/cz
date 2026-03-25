import type { ChatMessage, ChatThreadSummary } from "@/src/domain/entities/chat";

export type ThreadSubscriptionHandler = (thread: ChatThreadSummary) => void;
export type MessageSubscriptionHandler = (message: ChatMessage) => void;

export interface ChatPanelPort {
  listThreads(userId: string): Promise<ChatThreadSummary[]>;
  listMessages(userId: string, threadId: string): Promise<ChatMessage[]>;
  createUserMessage(input: ChatMessage): Promise<void>;
  saveThread(input: ChatThreadSummary): Promise<void>;
  respond(input: {
    accessToken: string;
    threadId: string;
    text: string;
    userId: string;
  }): Promise<{ answer?: string; thread?: ChatThreadSummary; messageId?: string }>;
  subscribeToThreads(userId: string, handler: ThreadSubscriptionHandler): () => void;
  subscribeToMessages(
    userId: string,
    threadId: string,
    handler: MessageSubscriptionHandler,
  ): () => void;
}
