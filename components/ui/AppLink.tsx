import Link from "next/link";

import styles from "./AppLink.module.css";

type AppLinkProps = {
  href: string;
  children: React.ReactNode;
  looksLikeButton?: boolean;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
};

export function AppLink({
  href,
  children,
  looksLikeButton = false,
  onClick,
}: AppLinkProps) {
  return (
    <Link
      className={`${styles.link} ${looksLikeButton ? styles.buttonLike : ""}`.trim()}
      href={href}
      onClick={onClick}
    >
      {children}
    </Link>
  );
}
