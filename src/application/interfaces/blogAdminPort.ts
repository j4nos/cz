import type { BlogPost } from "@/src/domain/entities/content";

export interface BlogAdminPort {
  listBlogPosts: () => Promise<BlogPost[]>;
  saveBlogPost: (input: BlogPost) => Promise<BlogPost>;
  deleteBlogPost: (blogPostId: string) => Promise<void>;
}
