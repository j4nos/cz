import { NextResponse } from "next/server";

import { authorizeChatRequest, createChatService, mapChatRouteError } from "@/app/api/chat/_shared";

export const runtime = "nodejs";

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

    const auth = await authorizeChatRequest(request, userId);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const result = await createChatService().sendMessage({
      userId,
      threadId,
      text: input,
    });

    return NextResponse.json({
      answer: result.answer,
      messageIds: result.messages.map((message: { id: string }) => message.id),
      thread: result.thread,
    });
  } catch (error) {
    return mapChatRouteError(error);
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
    const auth = await authorizeChatRequest(request, userId);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const chatService = createChatService();
    if (listThreads) {
      return NextResponse.json({ threads: await chatService.listThreads(userId) });
    }

    return NextResponse.json({ messages: await chatService.listMessages(userId, threadId!) });
  } catch (error) {
    return mapChatRouteError(error);
  }
}
