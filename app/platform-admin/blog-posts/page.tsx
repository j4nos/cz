"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  BlogPostForm,
  type BlogPostFormInput,
} from "@/components/platform-admin/BlogPostForm";
import { BlogPostsTable } from "@/components/platform-admin/BlogPostsTable";
import type { Schema } from "@/amplify/data/resource";
import { generateClient } from "aws-amplify/data";
import { uploadData } from "aws-amplify/storage";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import type { BlogPost } from "@/src/domain/content";
import { ensureAmplifyConfigured } from "@/src/infrastructure/amplify/config";
import { createBlogAdminController } from "@/src/infrastructure/controllers/createBlogAdminController";
import { blogCoverPrefix, toSafeFileName } from "@/src/infrastructure/storage/publicUrls";

export default function PlatformAdminBlogPostsPage() {
  const { loading, isAuthenticated, profile } = useAuth();
  const { setToast } = useToast();
  const controller = useMemo(() => createBlogAdminController(), []);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);

  const isPlatformAdmin = profile?.role === "platform-admin";

  const loadPosts = useCallback(async () => {
    const next = await controller.listBlogPosts();
    setPosts(next);
  }, [controller]);

  useEffect(() => {
    if (!loading && isAuthenticated && isPlatformAdmin) {
      void loadPosts();
    }
  }, [isAuthenticated, isPlatformAdmin, loadPosts, loading]);

  const editingPost = useMemo(
    () => posts.find((post) => post.id === editingPostId) ?? null,
    [posts, editingPostId]
  );

  async function handleSubmit(values: BlogPostFormInput, coverFile: File | null) {
    setSaving(true);
    try {
      const nextPost: BlogPost = {
        id:
          values.id ??
          (typeof crypto !== "undefined"
            ? crypto.randomUUID()
            : `blog-${Date.now()}`),
        title: values.title,
        excerpt: values.excerpt,
        coverImage: values.coverImage,
        contentHtml: values.contentHtml,
        publishedAt: values.publishedAt,
        status: values.status,
        updatedAt: new Date().toISOString(),
      };

      await controller.saveBlogPost(nextPost);
      if (coverFile && nextPost.id) {
        ensureAmplifyConfigured();
        const client = generateClient<Schema>();
        const fileName = `${Date.now()}-${toSafeFileName(coverFile.name)}`;
        const path = `${blogCoverPrefix(nextPost.id)}${fileName}`;
        await uploadData({
          path,
          data: coverFile,
          options: {
            contentType: coverFile.type || undefined,
          },
        }).result;
        await client.models.BlogPost.update({
          id: nextPost.id,
          coverImage: path,
        });
      }
      await loadPosts();
      setEditingPostId(nextPost.id);
      setToast("Blog post saved", "success", 2000);
    } catch (error) {
      console.error("save blog post failed", error);
      setToast("Failed to save blog post", "danger", 2400);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(postId: string) {
    setDeletingId(postId);
    try {
      await controller.deleteBlogPost(postId);
      if (editingPostId === postId) {
        setEditingPostId(null);
      }
      await loadPosts();
      setToast("Blog post deleted", "success", 1800);
    } catch (error) {
      console.error("delete blog post failed", error);
      setToast("Failed to delete blog post", "danger", 2400);
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return null;
  }

  if (!isAuthenticated) {
    return <p className="muted">Login to manage blog posts.</p>;
  }

  if (!isPlatformAdmin) {
    return <p className="muted">Only platform admins can access this page.</p>;
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
