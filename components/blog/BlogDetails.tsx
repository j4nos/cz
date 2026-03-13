import type { BlogPost } from "@/src/ui/mockData";

function stripUnsafeHtml(html: string) {
  return html.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "");
}

export function BlogDetails({ post }: { post: BlogPost }) {
  return (
    <article>
      <h1>{post.title}</h1>
      <img alt={post.title} src={post.coverImage} />
      <p>{new Date(post.publishedAt).toLocaleString("en-US")}</p>
      <div dangerouslySetInnerHTML={{ __html: stripUnsafeHtml(post.contentHtml) }} />
    </article>
  );
}
