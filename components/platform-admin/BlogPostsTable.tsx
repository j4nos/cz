"use client";

import { Button } from "@/components/ui/Button";
import { Table } from "@/components/ui/Table";
import type { BlogPost } from "@/src/domain/content";

import styles from "./BlogPostsTable.module.css";

type BlogPostsTableProps = {
  posts: BlogPost[];
  deletingId?: string | null;
  onEdit: (postId: string) => void;
  onDelete: (postId: string) => Promise<void>;
};

function formatDate(value?: string) {
  if (!value) return "\u2013";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "\u2013";
  return date.toLocaleString();
}

export function BlogPostsTable({
  posts,
  deletingId = null,
  onEdit,
  onDelete,
}: BlogPostsTableProps) {
  return (
    <Table>
      <thead>
        <tr>
          <th>Title</th>
          <th>Status</th>
          <th>Published</th>
          <th>Updated</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {posts.map((post) => (
          <tr key={post.id}>
            <td>
              <div className={styles.titleWrap}>
                <span>{post.title}</span>
                <span className="muted">{post.id}</span>
              </div>
            </td>
            <td>{post.status}</td>
            <td>{formatDate(post.publishedAt)}</td>
            <td>{formatDate(post.updatedAt)}</td>
            <td>
              <div className={styles.actions}>
                <Button type="button" variant="ghost" onClick={() => onEdit(post.id)}>
                  Edit
                </Button>
                <Button
                  type="button"
                  onClick={() => void onDelete(post.id)}
                  disabled={deletingId === post.id}
                >
                  {deletingId === post.id ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </td>
          </tr>
        ))}
        {posts.length === 0 ? (
          <tr>
            <td colSpan={5}>No blog posts yet.</td>
          </tr>
        ) : null}
      </tbody>
    </Table>
  );
}
