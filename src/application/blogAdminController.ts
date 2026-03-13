import type { BlogPost } from "@/src/domain/content";

export interface BlogAdminController {
  listBlogPosts: () => Promise<BlogPost[]>;
  saveBlogPost: (input: BlogPost) => Promise<BlogPost>;
  deleteBlogPost: (blogPostId: string) => Promise<void>;
}
