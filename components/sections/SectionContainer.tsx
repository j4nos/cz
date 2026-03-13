import type { ReactNode } from "react";
import styles from "./SectionContainer.module.css";

export function SectionContainer({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`${styles.section} ${className ?? ""}`.trim()}>
      <div className={styles.container}>{children}</div>
    </section>
  );
}
