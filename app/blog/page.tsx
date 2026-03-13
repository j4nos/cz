import { BlogList } from "@/components/blog/BlogList";
import { getPublishedBlogPosts } from "@/src/ui/queries";

export default function BlogPage() {
  return <BlogList posts={getPublishedBlogPosts()} />;
}
