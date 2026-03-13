"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";

import { ChatLauncher } from "@/components/chat/ChatLauncher";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { Footer } from "@/components/footer/Footer";
import { Navbar } from "@/components/navigation/Navbar";
import { Toast } from "@/components/toast/Toast";

import styles from "./AppShell.module.css";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [desktopChatOpen, setDesktopChatOpen] = useState(false);
  const pathname = usePathname();
  const isChatPage = pathname?.startsWith("/chat");

  return (
    <div className={styles.page}>
      <Navbar />
      <Toast />
      <div
        className={`${styles.mainRow} ${
          desktopChatOpen ? styles.chatOpen : ""
        }`.trim()}
      >
        <main className={styles.main}>
          <div className={styles.container}>{children}</div>
        </main>
        {desktopChatOpen ? (
          <ChatPanel onClose={() => setDesktopChatOpen(false)} />
        ) : null}
      </div>
      <Footer />
      {!desktopChatOpen && !isChatPage ? (
        <ChatLauncher onOpenDesktop={() => setDesktopChatOpen(true)} />
      ) : null}
    </div>
  );
}
