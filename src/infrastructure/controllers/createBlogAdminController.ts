"use client";

import type { BlogAdminController } from "@/src/application/blogAdminController";
import { AmplifyBlogAdminController } from "@/src/infrastructure/controllers/amplifyBlogAdminController";

let controller: BlogAdminController | null = null;

export function createBlogAdminController(): BlogAdminController {
  if (controller) {
    return controller;
  }

  controller = new AmplifyBlogAdminController();
  return controller;
}
