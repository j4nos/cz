import type { BlogPost } from "@/src/domain/content";
import { AppLink } from "@/components/ui/AppLink";

import styles from "./BlogList.module.css";

function formatDate(value?: string) {
  if (!value) {
    return "Unknown date";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return date.toLocaleDateString();
}

export function BlogList({ posts }: { posts: BlogPost[] }) {
  if (!posts.length) {
    return <p className="muted">No published blog posts yet.</p>;
  }

  return (
    <div className={styles.grid}>
      {posts.map((post) => (
        <article key={post.id} className={styles.card}>
          {post.coverImage ? (
            <img
              className={styles.cover}
              src={post.coverImage}
              alt={post.title}
            />
          ) : null}
          <div className={styles.content}>
            <p className="muted">{formatDate(post.publishedAt)}</p>
            <h2 className={styles.title}>{post.title}</h2>
            <p className={styles.excerpt}>{post.excerpt}</p>
            <AppLink href={`/blog/${post.id}`}>Read more</AppLink>
          </div>
        </article>
      ))}
    </div>
  );
}
