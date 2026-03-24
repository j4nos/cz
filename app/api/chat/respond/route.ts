import { NextResponse } from "next/server";

import outputs from "@/amplify_outputs.json";
import type { ChatMessage } from "@/src/domain/entities/chat";
import { verifyAccessToken } from "@/src/infrastructure/auth/verifyAccessToken";
import { RuleBasedChatGateway } from "@/src/infrastructure/gateways/ruleBasedChatGateway";

export const runtime = "nodejs";

const dataUrl = outputs.data?.url;

const getBearerToken = (request: Request): string => {
  const authHeader = request.headers.get("authorization") || "";
  if (!authHeader.startsWith("Bearer ")) {
    return "";
  }

  return authHeader.slice("Bearer ".length).trim();
};

async function callDataGraphql<T>(
  token: string,
  query: string,
  variables: Record<string, unknown>,
): Promise<T> {
  if (!dataUrl) {
    throw new Error("Amplify Data URL is missing.");
  }

  const response = await fetch(dataUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: token,
    },
    body: JSON.stringify({ query, variables }),
  });

  const payload = (await response.json()) as {
    data?: T;
    errors?: Array<{ message?: string }>;
  };

  if (!response.ok || payload.errors?.length) {
    throw new Error(payload.errors?.[0]?.message ?? "GraphQL request failed.");
  }

  if (!payload.data) {
    throw new Error("GraphQL response data is missing.");
  }

  return payload.data;
}

const listUserMessagesQuery = /* GraphQL */ `
  query ListUserMessages($filter: ModelUserMessageFilterInput, $nextToken: String) {
    listUserMessages(filter: $filter, nextToken: $nextToken) {
      items {
        id
        threadId
        userId
        role
        text
        createdAt
      }
      nextToken
    }
  }
`;

const getUserThreadQuery = /* GraphQL */ `
  query GetUserThread($id: ID!) {
    getUserThread(id: $id) {
      id
    }
  }
`;

const createUserThreadMutation = /* GraphQL */ `
  mutation CreateUserThread($input: CreateUserThreadInput!) {
    createUserThread(input: $input) {
      id
    }
  }
`;

const updateUserThreadMutation = /* GraphQL */ `
  mutation UpdateUserThread($input: UpdateUserThreadInput!) {
    updateUserThread(input: $input) {
      id
    }
  }
`;

const createUserMessageMutation = /* GraphQL */ `
  mutation CreateUserMessage($input: CreateUserMessageInput!) {
    createUserMessage(input: $input) {
      id
      createdAt
    }
  }
`;

async function listAllMessages(token: string, userId: string, threadId: string): Promise<ChatMessage[]> {
  const items: ChatMessage[] = [];
  let nextToken: string | null | undefined;

  do {
    const data = await callDataGraphql<{
      listUserMessages?: {
        items?: Array<{
          id: string;
          threadId?: string | null;
          userId?: string | null;
          role?: string | null;
          text?: string | null;
          createdAt?: string | null;
        }>;
        nextToken?: string | null;
      };
    }>(token, listUserMessagesQuery, {
      filter: {
        userId: { eq: userId },
        threadId: { eq: threadId },
      },
      ...(nextToken ? { nextToken } : {}),
    });

    items.push(
      ...(data.listUserMessages?.items ?? []).map((item) => ({
        id: item.id,
        threadId: item.threadId ?? threadId,
        userId: item.userId ?? userId,
        role: (item.role as ChatMessage["role"]) ?? "user",
        text: item.text ?? "",
        createdAt: item.createdAt ?? "",
      })),
    );
    nextToken = data.listUserMessages?.nextToken;
  } while (nextToken);

  return items.sort((left, right) => left.createdAt.localeCompare(right.createdAt));
}

async function saveThread(token: string, input: {
  id: string;
  userId: string;
  lastMessageAt: string;
  lastMessageText: string;
}) {
  const existing = await callDataGraphql<{ getUserThread?: { id: string } | null }>(
    token,
    getUserThreadQuery,
    { id: input.id },
  );

  if (existing.getUserThread) {
    await callDataGraphql(token, updateUserThreadMutation, {
      input: {
        id: input.id,
        userId: input.userId,
        lastMessageAt: input.lastMessageAt,
        lastMessageText: input.lastMessageText,
      },
    });
    return;
  }

  await callDataGraphql(token, createUserThreadMutation, {
    input: {
      id: input.id,
      userId: input.userId,
      lastMessageAt: input.lastMessageAt,
      lastMessageText: input.lastMessageText,
      state: "{}",
    },
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      threadId?: string;
      input?: string;
      userId?: string;
    };

    const threadId = body.threadId?.trim();
    const input = body.input?.trim();
    const userId = body.userId?.trim();

    if (!threadId || !input || !userId) {
      return NextResponse.json(
        { error: "threadId, userId and input are required." },
        { status: 400 },
      );
    }

    const token = getBearerToken(request);
    if (!token) {
      return NextResponse.json({ error: "Missing bearer token." }, { status: 401 });
    }

    const payload = await verifyAccessToken(token);
    const tokenUserId = payload.sub as string | undefined;
    if (!tokenUserId || tokenUserId !== userId) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const history = await listAllMessages(token, userId, threadId);
    const gateway = new RuleBasedChatGateway();
    const answer = await gateway.reply({
      userId,
      threadId,
      message: input,
      history: history.slice(-8),
    });

    const assistantCreatedAt = new Date().toISOString();
    const messageId = typeof crypto !== "undefined" ? crypto.randomUUID() : `chat-${Date.now()}`;
    const messageResult = await callDataGraphql<{
      createUserMessage?: { id: string; createdAt?: string | null } | null;
    }>(token, createUserMessageMutation, {
      input: {
        id: messageId,
        threadId,
        userId,
        role: "assistant",
        text: answer,
        createdAt: assistantCreatedAt,
      },
    });

    const lastMessageAt = messageResult.createUserMessage?.createdAt ?? assistantCreatedAt;
    await saveThread(token, {
      id: threadId,
      userId,
      lastMessageAt,
      lastMessageText: answer,
    });

    return NextResponse.json({
      answer,
      thread: {
        threadId,
        lastMessageAt,
        lastMessageText: answer,
      },
      messageId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
