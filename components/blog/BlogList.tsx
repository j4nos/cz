import Link from "next/link";

import type { BlogPost } from "@/src/ui/mockData";

export function BlogList({ posts }: { posts: BlogPost[] }) {
  if (posts.length === 0) {
    return <p>No published blog posts yet.</p>;
  }

  return (
    <section>
      <h1>Blog</h1>
      {posts.map((post) => (
        <article key={post.id}>
          <img alt={post.title} src={post.coverImage} />
          <h2>{post.title}</h2>
          <p>{post.excerpt}</p>
          <p>{new Date(post.publishedAt).toLocaleString("en-US")}</p>
          <Link href={`/blog/${post.id}`}>Read more</Link>
        </article>
      ))}
    </section>
  );
}
