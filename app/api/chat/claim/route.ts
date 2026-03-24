import { NextResponse } from "next/server";

import outputs from "@/amplify_outputs.json";
import { verifyAccessToken } from "@/src/infrastructure/auth/verifyAccessToken";

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
        state
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

const createUserThreadMutation = /* GraphQL */ `
  mutation CreateUserThread($input: CreateUserThreadInput!) {
    createUserThread(input: $input) {
      id
    }
  }
`;

const createUserMessageMutation = /* GraphQL */ `
  mutation CreateUserMessage($input: CreateUserMessageInput!) {
    createUserMessage(input: $input) {
      id
    }
  }
`;

const deleteUserThreadMutation = /* GraphQL */ `
  mutation DeleteUserThread($input: DeleteUserThreadInput!) {
    deleteUserThread(input: $input) {
      id
    }
  }
`;

const deleteUserMessageMutation = /* GraphQL */ `
  mutation DeleteUserMessage($input: DeleteUserMessageInput!) {
    deleteUserMessage(input: $input) {
      id
    }
  }
`;

type UserThreadRecord = {
  id: string;
  userId?: string | null;
  lastMessageAt?: string | null;
  lastMessageText?: string | null;
  state?: string | null;
};

type UserMessageRecord = {
  id: string;
  threadId?: string | null;
  userId?: string | null;
  role?: string | null;
  text?: string | null;
  createdAt?: string | null;
};

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

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      fromUserId?: string;
      guestAccessToken?: string;
      toUserId?: string;
    };
    const fromUserId = body.fromUserId?.trim();
    const guestAccessToken = body.guestAccessToken?.trim();
    const toUserId = body.toUserId?.trim();

    if (!fromUserId || !toUserId || !guestAccessToken) {
      return NextResponse.json(
        { error: "fromUserId, guestAccessToken and toUserId are required." },
        { status: 400 },
      );
    }

    const bearerToken = getBearerToken(request);
    if (!bearerToken) {
      return NextResponse.json({ error: "Missing bearer token." }, { status: 401 });
    }

    const targetPayload = await verifyAccessToken(bearerToken);
    const targetUserId = targetPayload.sub as string | undefined;
    if (!targetUserId || targetUserId !== toUserId) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const guestPayload = await verifyAccessToken(guestAccessToken);
    const guestUserId = guestPayload.sub as string | undefined;
    if (!guestUserId || guestUserId !== fromUserId) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    if (fromUserId === toUserId) {
      return NextResponse.json({ migrated: false });
    }

    const threads = await listAllGraphql<UserThreadRecord>(
      guestAccessToken,
      listUserThreadsQuery,
      "listUserThreads",
      { userId: { eq: fromUserId } },
    );

    for (const thread of threads) {
      await callDataGraphql(bearerToken, createUserThreadMutation, {
        input: {
          id: thread.id,
          userId: toUserId,
          ...(thread.lastMessageAt ? { lastMessageAt: thread.lastMessageAt } : {}),
          ...(thread.lastMessageText ? { lastMessageText: thread.lastMessageText } : {}),
          state: thread.state ?? "{}",
        },
      });
    }

    const messages = await listAllGraphql<UserMessageRecord>(
      guestAccessToken,
      listUserMessagesQuery,
      "listUserMessages",
      { userId: { eq: fromUserId } },
    );

    for (const message of messages) {
      await callDataGraphql(bearerToken, createUserMessageMutation, {
        input: {
          id: message.id,
          threadId: message.threadId,
          userId: toUserId,
          role: message.role,
          text: message.text,
          createdAt: message.createdAt,
        },
      });
    }

    for (const message of messages) {
      await callDataGraphql(guestAccessToken, deleteUserMessageMutation, {
        input: { id: message.id },
      });
    }

    for (const thread of threads) {
      await callDataGraphql(guestAccessToken, deleteUserThreadMutation, {
        input: { id: thread.id },
      });
    }

    return NextResponse.json({
      migrated: true,
      threads: threads.length,
      messages: messages.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
