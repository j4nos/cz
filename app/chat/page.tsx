 "use client";

import { useRouter } from "next/navigation";

import { ChatPanel } from "@/components/chat/ChatPanel";

export default function ChatPage() {
  const router = useRouter();

  return <ChatPanel mobile onClose={() => router.push("/")} />;
}
