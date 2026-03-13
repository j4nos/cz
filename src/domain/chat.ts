export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  threadId: string;
  userId: string;
  role: ChatRole;
  text: string;
  createdAt: string;
}

export interface ChatThreadSummary {
  threadId: string;
  userId: string;
  lastMessageAt: string;
  lastMessageText: string;
  state?: string;
}
