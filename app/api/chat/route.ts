import { NextResponse } from "next/server";

import { ChatService } from "@/src/application/use-cases/chatService";
import { RuleBasedChatGateway } from "@/src/infrastructure/gateways/ruleBasedChatGateway";
import { AmplifyChatRepository } from "@/src/infrastructure/repositories/amplifyChatRepository";

export const runtime = "nodejs";

class RouteIdGenerator {
  next(): string {
    return typeof crypto !== "undefined" ? crypto.randomUUID() : `chat-${Date.now()}`;
  }
}

class RouteClock {
  now(): string {
    return new Date().toISOString();
  }
}

function createService() {
  return new ChatService(
    new AmplifyChatRepository(),
    new RuleBasedChatGateway(),
    new RouteIdGenerator(),
    new RouteClock(),
  );
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

    const service = createService();
    const result = await service.sendMessage({
      threadId,
      text: input,
      userId,
    });

    return NextResponse.json({
      answer: result.answer,
      messageIds: result.messages.map((message) => message.id),
      thread: result.thread,
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
    const service = createService();

    if (listThreads) {
      const threads = await service.listThreads(userId);
      return NextResponse.json({ threads });
    }

    const messages = await service.listMessages(userId, threadId ?? "");
    return NextResponse.json({ messages });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
