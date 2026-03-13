import { BlogList } from "@/components/blog/BlogList";
import { listPublicBlogPosts } from "@/src/application/publicContent";
import { createPublicContentReader } from "@/src/infrastructure/repositories/createPublicContentReader";

export const revalidate = 60;

export default async function BlogPage() {
  const posts = await listPublicBlogPosts(createPublicContentReader());

  return (
    <div className="vertical-stack-with-gap">
      <header>
        <h1>Blog</h1>
        <p className="muted">Latest updates from Cityzeen.</p>
      </header>
      <BlogList posts={posts} />
    </div>
  );
}
