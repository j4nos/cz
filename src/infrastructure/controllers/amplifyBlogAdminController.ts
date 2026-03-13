"use client";

import type { BlogAdminController } from "@/src/application/blogAdminController";
import type { BlogPost } from "@/src/domain/content";
import { AmplifyInvestmentRepository } from "@/src/infrastructure/repositories/amplifyInvestmentRepository";

export class AmplifyBlogAdminController implements BlogAdminController {
  constructor(private readonly repository: AmplifyInvestmentRepository = new AmplifyInvestmentRepository()) {}

  async listBlogPosts(): Promise<BlogPost[]> {
    return this.repository.listBlogPosts();
  }

  async saveBlogPost(input: BlogPost): Promise<BlogPost> {
    return this.repository.saveBlogPost(input);
  }

  async deleteBlogPost(blogPostId: string): Promise<void> {
    await this.repository.deleteBlogPost(blogPostId);
  }
}
