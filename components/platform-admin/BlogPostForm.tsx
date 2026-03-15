"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/Button";
import {
  Form,
  FormField,
  FormInput,
  FormSelect,
  FormTextarea,
} from "@/components/ui/Form";
import type { BlogPostEditorInput } from "@/src/application/use-cases/blogPostAdminService";
import type { BlogPost } from "@/src/domain/entities/content";

import styles from "./BlogPostForm.module.css";

type BlogPostFormProps = {
  initialPost?: BlogPost | null;
  saving?: boolean;
  onSubmit: (values: BlogPostEditorInput, coverFile: File | null) => Promise<void>;
  onCancelEdit?: () => void;
};

function toLocalDateTimeInput(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60_000;
  const local = new Date(date.getTime() - offset);
  return local.toISOString().slice(0, 16);
}

function fromLocalDateTimeInput(value: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString();
}

export function BlogPostForm({
  initialPost,
  saving = false,
  onSubmit,
  onCancelEdit,
}: BlogPostFormProps) {
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [contentHtml, setContentHtml] = useState("");
  const [publishedAt, setPublishedAt] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [coverFile, setCoverFile] = useState<File | null>(null);

  const isEditing = Boolean(initialPost?.id);
  const initialPublishedAt = useMemo(
    () => toLocalDateTimeInput(initialPost?.publishedAt),
    [initialPost?.publishedAt],
  );

  useEffect(() => {
    setTitle(initialPost?.title ?? "");
    setExcerpt(initialPost?.excerpt ?? "");
    setCoverImage(initialPost?.coverImage ?? "");
    setContentHtml(initialPost?.contentHtml ?? "");
    setPublishedAt(initialPublishedAt);
    setStatus(initialPost?.status === "published" ? "published" : "draft");
    setCoverFile(null);
  }, [initialPost, initialPublishedAt]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit(
      {
        id: initialPost?.id,
        title: title.trim(),
        excerpt: excerpt.trim(),
        coverImage: coverImage.trim() || initialPost?.coverImage?.trim() || "",
        contentHtml,
        publishedAt: fromLocalDateTimeInput(publishedAt),
        status,
      },
      coverFile,
    );
  }

  return (
    <Form onSubmit={handleSubmit}>
      <h2>{isEditing ? "Edit blog post" : "Create blog post"}</h2>
      <FormField label="Title" htmlFor="blog-title">
        <FormInput
          id="blog-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Post title"
        />
      </FormField>
      <FormField label="Excerpt" htmlFor="blog-excerpt">
        <FormTextarea
          id="blog-excerpt"
          rows={3}
          value={excerpt}
          onChange={(event) => setExcerpt(event.target.value)}
          placeholder="Short summary for the list page"
        />
      </FormField>
      <FormField label="Cover image URL" htmlFor="blog-cover-url">
        <FormInput
          id="blog-cover-url"
          value={coverImage}
          onChange={(event) => setCoverImage(event.target.value)}
          placeholder="https://..."
        />
      </FormField>
      <FormField label="Cover image upload" htmlFor="blog-cover-file">
        <FormInput
          id="blog-cover-file"
          type="file"
          accept="image/*"
          onChange={(event) => {
            const nextFile = event.target.files?.[0] ?? null;
            setCoverFile(nextFile);
          }}
        />
      </FormField>
      <FormField label="HTML content" htmlFor="blog-content-html">
        <FormTextarea
          id="blog-content-html"
          rows={12}
          value={contentHtml}
          onChange={(event) => setContentHtml(event.target.value)}
          placeholder="<p>Post content</p>"
        />
      </FormField>
      <FormField label="Publish date" htmlFor="blog-published-at">
        <FormInput
          id="blog-published-at"
          type="datetime-local"
          value={publishedAt}
          onChange={(event) => setPublishedAt(event.target.value)}
        />
      </FormField>
      <FormField label="Status" htmlFor="blog-status">
        <FormSelect
          id="blog-status"
          value={status}
          onChange={(event) => setStatus(event.target.value as "draft" | "published")}
          options={[
            { value: "draft", label: "Draft" },
            { value: "published", label: "Published" },
          ]}
        />
      </FormField>
      <div className={styles.actions}>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </Button>
        {isEditing ? (
          <Button
            type="button"
            variant="ghost"
            onClick={onCancelEdit}
            disabled={saving}
          >
            Cancel edit
          </Button>
        ) : null}
      </div>
    </Form>
  );
}
