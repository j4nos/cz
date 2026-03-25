"use client";

import { generateClient } from "aws-amplify/data";

import type { Schema } from "@/amplify/data/resource";
import type {
  ChatPanelPort,
  MessageSubscriptionHandler,
  ThreadSubscriptionHandler,
} from "@/src/application/interfaces/chatPanelPort";
import { ensureAmplifyConfigured } from "@/src/config/amplify";
import type { ChatMessage, ChatThreadSummary } from "@/src/domain/entities/chat";
import { listAll } from "@/src/infrastructure/amplify/pagination";

function createAmplifyClient() {
  ensureAmplifyConfigured();
  return generateClient<Schema>();
}

function mapThread(item: Schema["UserThread"]["type"]): ChatThreadSummary {
  return {
    threadId: item.id,
    userId: item.userId ?? "",
    lastMessageAt: item.lastMessageAt ?? "",
    lastMessageText: item.lastMessageText ?? "",
    state: item.state ?? undefined,
  };
}

function mapMessage(item: Schema["UserMessage"]["type"]): ChatMessage {
  return {
    id: item.id,
    threadId: item.threadId ?? "",
    userId: item.userId ?? "",
    role: (item.role as ChatMessage["role"]) ?? "user",
    text: item.text ?? "",
    createdAt: item.createdAt ?? "",
  };
}

export function createChatPanelClient(): ChatPanelPort {
  const client = createAmplifyClient();

  return {
    async listThreads(userId) {
      const items = await listAll<Schema["UserThread"]["type"]>((nextToken) =>
        client.models.UserThread.list({
          filter: { userId: { eq: userId } },
          authMode: "userPool",
          ...(nextToken ? { nextToken } : {}),
        }),
      );

      return items
        .map(mapThread)
        .sort((left, right) => right.lastMessageAt.localeCompare(left.lastMessageAt));
    },
    async listMessages(userId, threadId) {
      const items = await listAll<Schema["UserMessage"]["type"]>((nextToken) =>
        client.models.UserMessage.list({
          filter: {
            threadId: { eq: threadId },
            userId: { eq: userId },
          },
          authMode: "userPool",
          ...(nextToken ? { nextToken } : {}),
        }),
      );

      return items
        .map(mapMessage)
        .sort((left, right) => left.createdAt.localeCompare(right.createdAt));
    },
    async createUserMessage(input) {
      await client.models.UserMessage.create(
        {
          id: input.id,
          threadId: input.threadId,
          userId: input.userId,
          role: input.role,
          text: input.text,
          createdAt: input.createdAt,
        },
        { authMode: "userPool" },
      );
    },
    async saveThread(input) {
      const existing = await client.models.UserThread.get(
        { id: input.threadId },
        { authMode: "userPool" },
      );

      if (existing.data) {
        await client.models.UserThread.update(
          {
            id: input.threadId,
            userId: input.userId,
            lastMessageAt: input.lastMessageAt,
            lastMessageText: input.lastMessageText,
            state: input.state,
          },
          { authMode: "userPool" },
        );
        return;
      }

      await client.models.UserThread.create(
        {
          id: input.threadId,
          userId: input.userId,
          lastMessageAt: input.lastMessageAt,
          lastMessageText: input.lastMessageText,
          state: input.state ?? "{}",
        },
        { authMode: "userPool" },
      );
    },
    async respond(input) {
      const response = await fetch("/api/chat/respond", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${input.accessToken}`,
        },
        body: JSON.stringify({
          threadId: input.threadId,
          input: input.text,
          userId: input.userId,
        }),
      });

      const data = (await response.json()) as {
        answer?: string;
        error?: string;
        thread?: ChatThreadSummary;
        messageId?: string;
      };
      if (!response.ok) {
        throw new Error(data.error || "Chat request failed.");
      }

      return {
        answer: data.answer,
        thread: data.thread,
        messageId: data.messageId,
      };
    },
    subscribeToThreads(userId, handler) {
      const onCreateSubscription = client.models.UserThread.onCreate({
        authMode: "userPool",
        filter: { userId: { eq: userId } },
      }).subscribe({
        next: (thread) => {
          handler(mapThread(thread));
        },
      });

      const onUpdateSubscription = client.models.UserThread.onUpdate({
        authMode: "userPool",
        filter: { userId: { eq: userId } },
      }).subscribe({
        next: (thread) => {
          handler(mapThread(thread));
        },
      });

      return () => {
        onCreateSubscription.unsubscribe();
        onUpdateSubscription.unsubscribe();
      };
    },
    subscribeToMessages(userId, threadId, handler) {
      const subscription = client.models.UserMessage.onCreate({
        authMode: "userPool",
        filter: {
          userId: { eq: userId },
          threadId: { eq: threadId },
        },
      }).subscribe({
        next: (message) => {
          handler(mapMessage(message));
        },
      });

      return () => {
        subscription.unsubscribe();
      };
    },
  };
}
