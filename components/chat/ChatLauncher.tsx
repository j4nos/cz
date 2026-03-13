"use client";

import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faComments } from "@fortawesome/free-solid-svg-icons";

import styles from "./ChatLauncher.module.css";

type ChatLauncherProps = {
  onOpenDesktop: () => void;
};

export function ChatLauncher({ onOpenDesktop }: ChatLauncherProps) {
  const router = useRouter();

  function handleOpen() {
    if (window.innerWidth < 960) {
      router.push("/chat");
      return;
    }

    onOpenDesktop();
  }

  return (
    <button
      type="button"
      onClick={handleOpen}
      className={styles.launcher}
      aria-label="Open chat"
    >
      <FontAwesomeIcon icon={faComments} /> Chat
    </button>
  );
}
