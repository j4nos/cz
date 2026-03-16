import Image from "next/image";

import styles from "./Card.module.css";

type CardProps = {
  title: string;
  body: string;
  cta?: React.ReactNode;
  imageSrc?: string;
};

export function Card({ title, body, cta, imageSrc }: CardProps) {
  const hasMedia = Boolean(imageSrc);
  const trimText = (value: string, max: number) =>
    value.length > max ? `${value.slice(0, max).trimEnd()}...` : value;
  const titleText = trimText(title, 60);
  const bodyText = trimText(body, 90);

  return (
    <article className={`${styles.card} ${hasMedia ? styles.media : ""}`.trim()}>
      {hasMedia ? (
        <>
          <div className={styles.mediaImageWrap}>
            <Image alt={titleText} className={styles.mediaImage} src={imageSrc!} width={370} height={370} />
          </div>
          <div className={styles.mediaContent}>
            <h3 className={styles.title}>{titleText}</h3>
            <p className={styles.body}>{bodyText}</p>
            {cta ? <div className={styles.footer}>{cta}</div> : null}
          </div>
        </>
      ) : (
        <>
          <h3 className={styles.title}>{titleText}</h3>
          <p className={styles.body}>{bodyText}</p>
          {cta ? <div className={styles.footer}>{cta}</div> : null}
        </>
      )}
    </article>
  );
}
