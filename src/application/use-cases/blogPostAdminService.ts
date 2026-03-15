import type { BlogAdminPort } from "@/src/application/interfaces/blogAdminPort";
import type { BlogPost } from "@/src/domain/entities/content";

export type BlogPostEditorInput = {
  id?: string;
  title: string;
  excerpt: string;
  coverImage: string;
  contentHtml: string;
  publishedAt: string;
  status: "draft" | "published";
};

type SaveBlogPostInput = {
  values: BlogPostEditorInput;
  coverFile: File | null;
};

export class BlogPostAdminService {
  constructor(
    private readonly controller: BlogAdminPort,
    private readonly uploadCoverImage: (input: {
      postId: string;
      file: File;
    }) => Promise<string>,
  ) {}

  async loadPosts(): Promise<BlogPost[]> {
    return this.controller.listBlogPosts();
  }

  validate(input: SaveBlogPostInput): string | undefined {
    const existingCoverImage = input.values.coverImage.trim();
    const hasCoverImage = Boolean(existingCoverImage || input.coverFile);

    if (!input.values.title.trim() || !input.values.excerpt.trim() || !input.values.contentHtml.trim()) {
      return "Title, excerpt and HTML content are required.";
    }
    if (!input.values.publishedAt) {
      return "Publish date is required.";
    }
    if (!hasCoverImage) {
      return "Add a cover image URL or upload a file.";
    }
    return undefined;
  }

  async save(input: SaveBlogPostInput): Promise<BlogPost> {
    const validationError = this.validate(input);
    if (validationError) {
      throw new Error(validationError);
    }

    const nextPost: BlogPost = {
      id:
        input.values.id ??
        (typeof crypto !== "undefined"
          ? crypto.randomUUID()
          : `blog-${Date.now()}`),
      title: input.values.title.trim(),
      excerpt: input.values.excerpt.trim(),
      coverImage: input.values.coverImage.trim(),
      contentHtml: input.values.contentHtml,
      publishedAt: input.values.publishedAt,
      status: input.values.status,
      updatedAt: new Date().toISOString(),
    };

    const savedPost = await this.controller.saveBlogPost(nextPost);
    if (!input.coverFile) {
      return savedPost;
    }

    const coverImage = await this.uploadCoverImage({
      postId: savedPost.id,
      file: input.coverFile,
    });

    return this.controller.saveBlogPost({
      ...savedPost,
      coverImage,
    });
  }

  async delete(postId: string): Promise<void> {
    await this.controller.deleteBlogPost(postId);
  }
}
