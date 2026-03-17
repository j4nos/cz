"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  BlogPostForm,
} from "@/components/platform-admin/BlogPostForm";
import { BlogPostsTable } from "@/components/platform-admin/BlogPostsTable";
import type { Schema } from "@/amplify/data/resource";
import { generateClient } from "aws-amplify/data";
import { uploadData } from "aws-amplify/storage";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import {
  BlogPostAdminService,
  type BlogPostEditorInput,
} from "@/src/application/use-cases/blogPostAdminService";
import type { BlogPost } from "@/src/domain/entities/content";
import { ensureAmplifyConfigured } from "@/src/config/amplify";
import { createBlogAdminController } from "@/src/infrastructure/controllers/createBlogAdminController";
import { blogCoverPrefix, toSafeFileName } from "@/src/infrastructure/storage/publicUrls";

export default function PlatformAdminBlogPostsPage() {
  const { loading, isAuthenticated, isAdmin } = useAuth();
  const { setToast } = useToast();
  const controller = useMemo(() => createBlogAdminController(), []);
  const blogPostAdminService = useMemo(
    () =>
      new BlogPostAdminService(controller, async ({ postId, file }) => {
        ensureAmplifyConfigured();
        const client = generateClient<Schema>();
        const fileName = `${Date.now()}-${toSafeFileName(file.name)}`;
        const path = `${blogCoverPrefix(postId)}${fileName}`;
        await uploadData({
          path,
          data: file,
          options: {
            contentType: file.type || undefined,
          },
        }).result;
        await client.models.BlogPost.update({
          id: postId,
          coverImage: path,
        });
        return path;
      }),
    [controller],
  );
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);

  const loadPosts = useCallback(async () => {
    const next = await blogPostAdminService.loadPosts();
    setPosts(next);
  }, [blogPostAdminService]);

  useEffect(() => {
    if (!loading && isAuthenticated && isAdmin) {
      void loadPosts();
    }
  }, [isAuthenticated, isAdmin, loadPosts, loading]);

  const editingPost = useMemo(
    () => posts.find((post) => post.id === editingPostId) ?? null,
    [posts, editingPostId]
  );

  async function handleSubmit(values: BlogPostEditorInput, coverFile: File | null) {
    setSaving(true);
    try {
      const nextPost = await blogPostAdminService.save({
        values,
        coverFile,
      });
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
      await blogPostAdminService.delete(postId);
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

  if (!isAdmin) {
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
