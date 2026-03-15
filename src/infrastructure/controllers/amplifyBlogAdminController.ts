"use client";

import type { BlogAdminPort } from "@/src/application/interfaces/blogAdminPort";
import type { BlogPost } from "@/src/domain/entities/content";
import { AmplifyInvestmentRepository } from "@/src/infrastructure/repositories/amplifyInvestmentRepository";

export class AmplifyBlogAdminController implements BlogAdminPort {
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
