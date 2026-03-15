import { notFound } from "next/navigation";

import { BlogDetails } from "@/components/blog/BlogDetails";
import { getPublicBlogPost } from "@/src/application/use-cases/publicContent";
import { createPublicContentReader } from "@/src/infrastructure/repositories/createPublicContentReader";

export const revalidate = 60;

export default async function BlogDetailsPage({ params }: { params: { blogId: string } }) {
  const post = await getPublicBlogPost(createPublicContentReader(), params.blogId);

  if (!post) {
    notFound();
  }

  return <BlogDetails post={post} />;
}
