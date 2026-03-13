import styles from "./Badge.module.css";

type BadgeProps = {
  children: React.ReactNode;
  color?: "neutral" | "info" | "success" | "warning" | "danger" | "accent";
};

const COLOR_CLASS: Record<NonNullable<BadgeProps["color"]>, string> = {
  neutral: styles.colorNeutral,
  info: styles.colorInfo,
  success: styles.colorSuccess,
  warning: styles.colorWarning,
  danger: styles.colorDanger,
  accent: styles.colorAccent,
};

export function Badge({ children, color = "neutral" }: BadgeProps) {
  const colorClass = COLOR_CLASS[color];
  return (
    <span className={`${styles.badge} ${colorClass}`.trim()}>{children}</span>
  );
}
