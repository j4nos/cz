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

const listUserThreadsQuery = /* GraphQL */ `
  query ListUserThreads($filter: ModelUserThreadFilterInput, $nextToken: String) {
    listUserThreads(filter: $filter, nextToken: $nextToken) {
      items {
        id
        userId
        lastMessageAt
        lastMessageText
      }
      nextToken
    }
  }
`;

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

async function authorizeToken(request: Request, requestedUserId: string) {
  const token = getBearerToken(request);
  if (!token) {
    return { ok: false as const, status: 401, error: "Missing bearer token." };
  }

  try {
    const payload = await verifyAccessToken(token);
    const tokenUserId = payload.sub as string | undefined;
    if (!tokenUserId || tokenUserId !== requestedUserId) {
      return { ok: false as const, status: 403, error: "Forbidden." };
    }
  } catch {
    return { ok: false as const, status: 401, error: "Invalid bearer token." };
  }

  return { ok: true as const, token };
}

async function listAllGraphql<T>(
  token: string,
  query: string,
  rootKey: string,
  filter: Record<string, unknown>,
): Promise<T[]> {
  const items: T[] = [];
  let nextToken: string | null | undefined;

  do {
    const data = await callDataGraphql<Record<string, { items?: T[]; nextToken?: string | null }>>(
      token,
      query,
      {
        filter,
        ...(nextToken ? { nextToken } : {}),
      },
    );
    const page = data[rootKey];
    items.push(...(page?.items ?? []));
    nextToken = page?.nextToken;
  } while (nextToken);

  return items;
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
      input,
    });
    return;
  }

  await callDataGraphql(token, createUserThreadMutation, {
    input: {
      ...input,
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

    const auth = await authorizeToken(request, userId);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const token = auth.token;
    const now = new Date().toISOString();
    const messages = await listAllGraphql<{
      id: string;
      threadId?: string | null;
      userId?: string | null;
      role?: string | null;
      text?: string | null;
      createdAt?: string | null;
    }>(token, listUserMessagesQuery, "listUserMessages", {
      userId: { eq: userId },
      threadId: { eq: threadId },
    });

    const history: ChatMessage[] = messages
      .map((item): ChatMessage => ({
        id: item.id,
        threadId: item.threadId ?? threadId,
        userId: item.userId ?? userId,
        role: (item.role as ChatMessage["role"]) ?? "user",
        text: item.text ?? "",
        createdAt: item.createdAt ?? "",
      }))
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt));

    const userMessageId =
      typeof crypto !== "undefined" ? crypto.randomUUID() : `chat-user-${Date.now()}`;
    const assistantMessageId =
      typeof crypto !== "undefined" ? crypto.randomUUID() : `chat-assistant-${Date.now()}`;

    await callDataGraphql(token, createUserMessageMutation, {
      input: {
        id: userMessageId,
        threadId,
        userId,
        role: "user",
        text: input,
        createdAt: now,
      },
    });

    const gateway = new RuleBasedChatGateway();
    const nextHistory: ChatMessage[] = [
      ...history,
      {
        id: userMessageId,
        threadId,
        userId,
        role: "user",
        text: input,
        createdAt: now,
      },
    ];
    const answer = await gateway.reply({
      userId,
      threadId,
      message: input,
      history: nextHistory.slice(-8),
    });

    const assistantCreatedAt = new Date().toISOString();
    await callDataGraphql(token, createUserMessageMutation, {
      input: {
        id: assistantMessageId,
        threadId,
        userId,
        role: "assistant",
        text: answer,
        createdAt: assistantCreatedAt,
      },
    });

    await saveThread(token, {
      id: threadId,
      userId,
      lastMessageAt: assistantCreatedAt,
      lastMessageText: answer,
    });

    return NextResponse.json({
      answer,
      messageIds: [userMessageId, assistantMessageId],
      thread: {
        threadId,
        lastMessageAt: assistantCreatedAt,
        lastMessageText: answer,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId")?.trim();
  const threadId = searchParams.get("threadId")?.trim();
  const listThreads = searchParams.get("listThreads") === "1";

  if (!userId || (!threadId && !listThreads)) {
    return NextResponse.json(
      { error: "userId and threadId (or listThreads=1) are required." },
      { status: 400 },
    );
  }

  try {
    const auth = await authorizeToken(request, userId);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    if (listThreads) {
      const threads = await listAllGraphql<{
        id: string;
        lastMessageAt?: string | null;
        lastMessageText?: string | null;
      }>(auth.token, listUserThreadsQuery, "listUserThreads", {
        userId: { eq: userId },
      });
      return NextResponse.json({
        threads: threads
          .map((thread) => ({
            threadId: thread.id,
            lastMessageAt: thread.lastMessageAt ?? "",
            lastMessageText: thread.lastMessageText ?? "",
          }))
          .sort((left, right) => right.lastMessageAt.localeCompare(left.lastMessageAt)),
      });
    }

    const messages = await listAllGraphql<{
      id: string;
      threadId?: string | null;
      userId?: string | null;
      role?: string | null;
      text?: string | null;
      createdAt?: string | null;
    }>(auth.token, listUserMessagesQuery, "listUserMessages", {
      userId: { eq: userId },
      threadId: { eq: threadId },
    });

    return NextResponse.json({
      messages: messages
        .map((message) => ({
          id: message.id,
          role: (message.role as ChatMessage["role"]) ?? "user",
          text: message.text ?? "",
          createdAt: message.createdAt ?? undefined,
        }))
        .sort((left, right) => (left.createdAt ?? "").localeCompare(right.createdAt ?? "")),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
