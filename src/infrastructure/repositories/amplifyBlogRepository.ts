import type { Schema } from "@/amplify/data/resource";
import type { BlogPost } from "@/src/domain/entities/content";
import { listAll } from "@/src/infrastructure/amplify/pagination";
import { mapBlogPostRecord } from "@/src/infrastructure/amplify/schemaMappers";
import type {
  AmplifyDataClient,
  AmplifyReadAuthMode,
} from "@/src/infrastructure/repositories/amplifyClient";
import { normalizeStoredPublicPath } from "@/src/infrastructure/storage/publicUrls";

export class AmplifyBlogRepository {
  constructor(
    private readonly client: AmplifyDataClient,
    private readonly readAuthMode?: AmplifyReadAuthMode,
  ) {}

  async listPublishedBlogPosts(): Promise<BlogPost[]> {
    const records = await listAll<Schema["BlogPost"]["type"]>((nextToken) =>
      this.client.models.BlogPost.list({
        filter: { status: { eq: "published" } },
        ...(this.readAuthMode ? { authMode: this.readAuthMode } : {}),
        ...(nextToken ? { nextToken } : {}),
      }),
    );
    return records.map(mapBlogPostRecord);
  }

  async listBlogPosts(): Promise<BlogPost[]> {
    const records = await listAll<Schema["BlogPost"]["type"]>((nextToken) =>
      this.client.models.BlogPost.list({
        ...(this.readAuthMode ? { authMode: this.readAuthMode } : {}),
        ...(nextToken ? { nextToken } : {}),
      }),
    );
    return records.map(mapBlogPostRecord);
  }

  async saveBlogPost(blogPost: BlogPost): Promise<BlogPost> {
    const existing = await this.client.models.BlogPost.get({ id: blogPost.id });
    const payload = {
      id: blogPost.id,
      title: blogPost.title,
      excerpt: blogPost.excerpt,
      coverImage: blogPost.coverImage ? normalizeStoredPublicPath(blogPost.coverImage) : "",
      contentHtml: blogPost.contentHtml,
      status: blogPost.status,
      publishedAt: blogPost.publishedAt || null,
      updatedAt: blogPost.updatedAt,
    };

    if (existing.data) {
      await this.client.models.BlogPost.update(payload);
    } else {
      await this.client.models.BlogPost.create(payload);
    }

    return blogPost;
  }

  async deleteBlogPost(blogId: string): Promise<void> {
    await this.client.models.BlogPost.delete({ id: blogId });
  }
}
