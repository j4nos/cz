import type { BlogPost } from "@/src/domain/content";
import styles from "./BlogDetails.module.css";

type BlogDetailsProps = {
  post: BlogPost;
};

function formatDate(value?: string) {
  if (!value) return "Unknown date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return date.toLocaleDateString();
}

function sanitizeHtml(unsafeHtml: string) {
  return unsafeHtml
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/<(iframe|object|embed|link|meta)[^>]*?>/gi, "")
    .replace(/\son[a-z]+\s*=\s*"[^"]*"/gi, "")
    .replace(/\son[a-z]+\s*=\s*'[^']*'/gi, "")
    .replace(/\son[a-z]+\s*=\s*[^\s>]+/gi, "")
    .replace(/\s(href|src)\s*=\s*"javascript:[^"]*"/gi, ' $1="#"')
    .replace(/\s(href|src)\s*=\s*'javascript:[^']*'/gi, " $1='#'")
    .replace(/\s(href|src)\s*=\s*javascript:[^\s>]+/gi, ' $1="#"');
}

export function BlogDetails({ post }: BlogDetailsProps) {
  const safeHtml = sanitizeHtml(post.contentHtml ?? "");

  return (
    <article className={styles.article}>
      <header className={styles.header}>
        <p className="muted">{formatDate(post.publishedAt)}</p>
        <h1>{post.title}</h1>
      </header>
      {post.coverImage ? (
        <img src={post.coverImage} alt={post.title} className={styles.cover} />
      ) : null}
      <div
        className={styles.content}
        dangerouslySetInnerHTML={{ __html: safeHtml }}
      />
    </article>
  );
}
