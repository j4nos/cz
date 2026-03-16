import Image from "next/image";

import { AppLink } from "@/components/ui/AppLink";
import styles from "./PhotoCta.module.css";

type Props = {
  title: string;
  text: string;
  href: string;
  reverse?: boolean;
  image?: string;
};

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1000&q=80";

export function PhotoCta({
  title,
  text,
  href,
  reverse = false,
  image = DEFAULT_IMAGE,
}: Props) {
  return (
    <section className={`${styles.cta} ${reverse ? styles.reverse : ""}`.trim()}>
      <div className={styles.imageWrap}>
        <Image src={image} alt={title} className={styles.image} width={1000} height={750} />
      </div>
      <div className={styles.content}>
        <h2>{title}</h2>
        <p>{text}</p>
        <div className={styles.action}>
          <AppLink href={href} looksLikeButton>
            View Details
          </AppLink>
        </div>
      </div>
    </section>
  );
}
