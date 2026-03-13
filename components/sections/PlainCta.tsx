import { AppLink } from "@/components/ui/AppLink";

import styles from "./PlainCta.module.css";

type PlainCtaProps = {
  title: string;
  text: string;
  actionLabel: string;
  href: string;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
};

export function PlainCta({
  title,
  text,
  actionLabel,
  href,
  onClick,
}: PlainCtaProps) {
  return (
    <section className={styles.cta}>
      <div className={styles.content}>
        <h2>{title}</h2>
        <p>{text}</p>
      </div>
      <AppLink href={href} looksLikeButton onClick={onClick}>
        {actionLabel}
      </AppLink>
    </section>
  );
}
