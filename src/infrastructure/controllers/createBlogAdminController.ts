"use client";

import type { BlogAdminPort } from "@/src/application/interfaces/blogAdminPort";
import { createInvestmentRepository } from "@/src/infrastructure/composition/defaults";
import { AmplifyBlogAdminController } from "@/src/infrastructure/controllers/amplifyBlogAdminController";

let controller: BlogAdminPort | null = null;

export function createBlogAdminController(): BlogAdminPort {
  if (controller) {
    return controller;
  }

  controller = new AmplifyBlogAdminController(createInvestmentRepository());
  return controller;
}
