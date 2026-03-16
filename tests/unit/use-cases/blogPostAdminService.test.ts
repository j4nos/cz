import { describe, expect, it, vi } from "vitest";

import type { BlogAdminPort } from "@/src/application/interfaces/blogAdminPort";
import { BlogPostAdminService, type BlogPostEditorInput } from "@/src/application/use-cases/blogPostAdminService";
import { makeBlogPost } from "@/tests/helpers/factories";

function makeController(): BlogAdminPort {
  return {
    listBlogPosts: vi.fn().mockResolvedValue([makeBlogPost()]),
    saveBlogPost: vi.fn().mockImplementation(async (input) => input),
    deleteBlogPost: vi.fn().mockResolvedValue(undefined),
  };
}

function makeValues(overrides: Partial<BlogPostEditorInput> = {}): BlogPostEditorInput {
  return {
    id: "blog-1",
    title: "Market update",
    excerpt: "Excerpt",
    coverImage: "https://example.com/cover.jpg",
    contentHtml: "<p>Hello</p>",
    publishedAt: "2026-03-16",
    status: "draft",
    ...overrides,
  };
}

describe("BlogPostAdminService", () => {
  it("validates required title, excerpt and content", () => {
    const service = new BlogPostAdminService(makeController(), vi.fn());

    expect(service.validate({ values: makeValues({ title: "   " }), coverFile: null })).toBe(
      "Title, excerpt and HTML content are required.",
    );
    expect(service.validate({ values: makeValues({ excerpt: "   " }), coverFile: null })).toBe(
      "Title, excerpt and HTML content are required.",
    );
    expect(service.validate({ values: makeValues({ contentHtml: "   " }), coverFile: null })).toBe(
      "Title, excerpt and HTML content are required.",
    );
  });

  it("requires a publish date and a cover image source", () => {
    const service = new BlogPostAdminService(makeController(), vi.fn());

    expect(service.validate({ values: makeValues({ publishedAt: "" }), coverFile: null })).toBe(
      "Publish date is required.",
    );
    expect(service.validate({ values: makeValues({ coverImage: "   " }), coverFile: null })).toBe(
      "Add a cover image URL or upload a file.",
    );
  });

  it("loads posts through the admin controller", async () => {
    const controller = makeController();
    const service = new BlogPostAdminService(controller, vi.fn());

    await expect(service.loadPosts()).resolves.toEqual([makeBlogPost()]);
    expect(controller.listBlogPosts).toHaveBeenCalled();
  });

  it("saves once when no cover file is uploaded", async () => {
    const controller = makeController();
    const service = new BlogPostAdminService(controller, vi.fn());

    await service.save({ values: makeValues(), coverFile: null });

    expect(controller.saveBlogPost).toHaveBeenCalledTimes(1);
  });

  it("saves, uploads and saves again when a cover file is provided", async () => {
    const controller = makeController();
    const uploadCoverImage = vi.fn().mockResolvedValue("https://cdn.test/cover.jpg");
    const service = new BlogPostAdminService(controller, uploadCoverImage);

    const file = new File(["content"], "cover.png", { type: "image/png" });
    const saved = await service.save({ values: makeValues({ coverImage: "" }), coverFile: file });

    expect(controller.saveBlogPost).toHaveBeenCalledTimes(2);
    expect(uploadCoverImage).toHaveBeenCalledWith({ postId: "blog-1", file });
    expect(saved.coverImage).toBe("https://cdn.test/cover.jpg");
  });

  it("propagates upload errors", async () => {
    const controller = makeController();
    const service = new BlogPostAdminService(controller, vi.fn().mockRejectedValue(new Error("upload failed")));

    await expect(
      service.save({
        values: makeValues({ coverImage: "" }),
        coverFile: new File(["content"], "cover.png", { type: "image/png" }),
      }),
    ).rejects.toThrow("upload failed");
  });

  it("deletes posts through the controller", async () => {
    const controller = makeController();
    const service = new BlogPostAdminService(controller, vi.fn());

    await service.delete("blog-1");

    expect(controller.deleteBlogPost).toHaveBeenCalledWith("blog-1");
  });
});