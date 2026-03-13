"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import styles from "./StepNavigation.module.css";

type StepNavigationProps = {
  steps: { href: string; label: string }[];
  ariaLabel?: string;
};

export function StepNavigation({
  steps,
  ariaLabel = "Steps",
}: StepNavigationProps) {
  const pathname = usePathname();

  return (
    <nav className={styles.nav} aria-label={ariaLabel}>
      {steps.map((step) => {
        const active = pathname?.startsWith(step.href);
        return (
          <Link
            key={step.href}
            href={step.href}
            className={`${styles.step} ${active ? styles.active : ""}`.trim()}
          >
            <span className={styles.stepLabel}>{step.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
