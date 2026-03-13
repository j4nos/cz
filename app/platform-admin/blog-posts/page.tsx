import { BlogPostForm } from "@/components/platform-admin/BlogPostForm";
import { BlogPostsTable } from "@/components/platform-admin/BlogPostsTable";

export default function PlatformAdminBlogPostsPage() {
  return (
    <section>
      <h1>Blog management</h1>
      <BlogPostsTable />
      <BlogPostForm />
    </section>
  );
}
