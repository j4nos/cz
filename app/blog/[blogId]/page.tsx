import { notFound } from "next/navigation";

import { BlogDetails } from "@/components/blog/BlogDetails";
import { getBlogPostById } from "@/src/ui/queries";

export default function BlogDetailsPage({ params }: { params: { blogId: string } }) {
  const post = getBlogPostById(params.blogId);

  if (!post) {
    notFound();
  }

  return <BlogDetails post={post} />;
}
