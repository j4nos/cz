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

    const result = await createChatService().respondToLatestUserMessage({
      userId,
      threadId,
      text: input,
    });

    return NextResponse.json({
      answer: result.answer,
      thread: result.thread,
      messageId: result.message.id,
    });
  } catch (error) {
    return mapChatRouteError(error);
  }
}
