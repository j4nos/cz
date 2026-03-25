import { BlogList } from "@/components/blog/BlogList";
import { listPublicBlogPosts } from "@/src/application/use-cases/publicContent";
import { createPublicContentReader } from "@/src/presentation/composition/server";

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
