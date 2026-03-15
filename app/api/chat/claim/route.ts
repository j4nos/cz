import { generateClient } from "aws-amplify/data";
import { NextResponse } from "next/server";

import type { Schema } from "@/amplify/data/resource";
import {
  getAnonCookieName,
  parseAnonCookieValue,
} from "@/src/infrastructure/auth/anonSession";
import { ensureAmplifyConfigured } from "@/src/config/amplify";
import { listAll } from "@/src/infrastructure/amplify/pagination";
import { verifyAccessToken } from "@/src/infrastructure/auth/verifyAccessToken";
import { getNodeEnv } from "@/src/config/runtimeEnv";

const getClient = () => {
  ensureAmplifyConfigured();
  return generateClient<Schema>();
};

const getBearerToken = (request: Request): string => {
  const authHeader = request.headers.get("authorization") || "";
  if (!authHeader.startsWith("Bearer ")) return "";
  return authHeader.slice("Bearer ".length).trim();
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const withRetry = async <T>(fn: () => Promise<T>, attempts = 3) => {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        await sleep(200 * attempt);
      }
    }
  }
  throw lastError ?? new Error("Operation failed after retries.");
};

const updateInBatches = async <T>(
  items: T[],
  batchSize: number,
  worker: (item: T) => Promise<void>
) => {
  for (let index = 0; index < items.length; index += batchSize) {
    const batch = items.slice(index, index + batchSize);
    const results = await Promise.allSettled(
      batch.map((item) => withRetry(() => worker(item)))
    );
    const failures = results.filter((result) => result.status === "rejected");
    if (failures.length > 0) {
      throw new Error(`Batch update failed for ${failures.length} items.`);
    }
  }
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      toUserId?: string;
    };
    const toUserId = body.toUserId?.trim();

    if (!toUserId) {
      return NextResponse.json({ error: "toUserId is required." }, { status: 400 });
    }

    const token = getBearerToken(request);
    if (!token) {
      return NextResponse.json({ error: "Missing bearer token." }, { status: 401 });
    }
    const payload = await verifyAccessToken(token);
    const tokenUserId = payload.sub as string | undefined;
    if (!tokenUserId || tokenUserId !== toUserId) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const cookieHeader = request.headers.get("cookie") ?? "";
    const anonCookie = cookieHeader
      .split(";")
      .map((item) => item.trim())
      .find((item) => item.startsWith(`${getAnonCookieName()}=`));
    if (!anonCookie) {
      return NextResponse.json(
        { error: "Missing anonymous session." },
        { status: 401 }
      );
    }
    const anonValue = anonCookie.split("=").slice(1).join("=");
    const anonSession = anonValue ? parseAnonCookieValue(anonValue) : null;
    if (!anonSession) {
      return NextResponse.json(
        { error: "Invalid anonymous session." },
        { status: 401 }
      );
    }
    const fromUserId = anonSession.userId;

    if (fromUserId === toUserId) {
      const response = NextResponse.json({ migrated: false });
      response.cookies.set(getAnonCookieName(), "", {
        httpOnly: true,
        sameSite: "lax",
        secure: getNodeEnv() === "production",
        path: "/",
        maxAge: 0,
      });
      return response;
    }

    const client = getClient();

    const threads = await listAll<Schema["UserThread"]["type"], { nextToken?: string }>(
      (args) =>
        client.models.UserThread.list({
          filter: { userId: { eq: fromUserId } },
          ...(args ?? {}),
        })
    );
    await updateInBatches(threads, 25, async (thread) => {
      await client.models.UserThread.update({
        id: thread.id,
        userId: toUserId,
        ...(thread.lastMessageAt ? { lastMessageAt: thread.lastMessageAt } : {}),
        ...(thread.lastMessageText ? { lastMessageText: thread.lastMessageText } : {}),
        ...(thread.state ? { state: thread.state } : {}),
      });
    });

    const messages = await listAll<Schema["UserMessage"]["type"], { nextToken?: string }>(
      (args) =>
        client.models.UserMessage.list({
          filter: { userId: { eq: fromUserId } },
          ...(args ?? {}),
        })
    );
    await updateInBatches(messages, 25, async (message) => {
      await client.models.UserMessage.update({
        id: message.id,
        userId: toUserId,
        ...(message.threadId ? { threadId: message.threadId } : {}),
        ...(message.role ? { role: message.role } : {}),
        ...(message.text ? { text: message.text } : {}),
        ...(message.createdAt ? { createdAt: message.createdAt } : {}),
      });
    });

    await client.models.UserProfile.delete({ id: fromUserId });

    const response = NextResponse.json({
      migrated: true,
      threads: threads.length,
      messages: messages.length,
    });
    response.cookies.set(getAnonCookieName(), "", {
      httpOnly: true,
      sameSite: "lax",
      secure: getNodeEnv() === "production",
      path: "/",
      maxAge: 0,
    });
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
