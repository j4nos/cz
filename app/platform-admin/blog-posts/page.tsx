"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { BlogPostForm } from "@/components/platform-admin/BlogPostForm";
import { BlogPostsTable } from "@/components/platform-admin/BlogPostsTable";
import { usePrivateAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { type BlogPostEditorInput } from "@/src/application/use-cases/blogPostAdminService";
import type { BlogPost } from "@/src/domain/entities/content";
import { createBlogPostAdminService } from "@/src/presentation/composition/client";

export default function PlatformAdminBlogPostsPage() {
  const { accessToken } = usePrivateAuth();
  const { setToast } = useToast();
  const blogPostAdminService = useMemo(() => createBlogPostAdminService(), []);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);

  const loadPosts = useCallback(async () => {
    const next = await blogPostAdminService.loadPosts();
    setPosts(next);
  }, [blogPostAdminService]);

  useEffect(() => {
    void loadPosts();
  }, [loadPosts]);

  const editingPost = useMemo(
    () => posts.find((post) => post.id === editingPostId) ?? null,
    [posts, editingPostId]
  );

  function upsertPost(current: BlogPost[], nextPost: BlogPost) {
    const existingIndex = current.findIndex((post) => post.id === nextPost.id);
    if (existingIndex >= 0) {
      const copy = [...current];
      copy[existingIndex] = nextPost;
      return copy;
    }
    return [nextPost, ...current];
  }

  async function handleSubmit(values: BlogPostEditorInput, coverFile: File | null) {
    setSaving(true);
    try {
      const nextPost = await blogPostAdminService.save({
        values,
        coverFile,
      });
      setPosts((current) => upsertPost(current, nextPost));
      const reloadedPosts = await blogPostAdminService.loadPosts();
      setPosts(
        reloadedPosts.some((post) => post.id === nextPost.id)
          ? reloadedPosts
          : upsertPost(reloadedPosts, nextPost),
      );
      await fetch("/api/platform-admin/revalidate-blog", {
        method: "POST",
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
      });
      setEditingPostId(nextPost.id);
      setToast("Blog post saved", "success", 2000);
    } catch (error) {
      console.error("save blog post failed", error);
      const message =
        error instanceof Error ? error.message : "Failed to save blog post";
      setToast(message, "danger", 3000);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(postId: string) {
    setDeletingId(postId);
    try {
      await blogPostAdminService.delete(postId);
      if (editingPostId === postId) {
        setEditingPostId(null);
      }
      await loadPosts();
      await fetch("/api/platform-admin/revalidate-blog", {
        method: "POST",
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
      });
      setToast("Blog post deleted", "success", 1800);
    } catch (error) {
      console.error("delete blog post failed", error);
      setToast("Failed to delete blog post", "danger", 2400);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="vertical-stack-with-gap">
      <header>
        <h1>Blog posts</h1>
        <p className="muted">Create and manage public blog content.</p>
      </header>
      <BlogPostForm
        initialPost={editingPost}
        saving={saving}
        onSubmit={handleSubmit}
        onCancelEdit={() => setEditingPostId(null)}
      />
      <BlogPostsTable
        posts={posts}
        deletingId={deletingId}
        onEdit={setEditingPostId}
        onDelete={handleDelete}
      />
    </div>
  );
}
