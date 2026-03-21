import outputs from "@/amplify_outputs.json";

const storageCdnUrl = (() => {
  const custom = (outputs as { custom?: Record<string, unknown> }).custom;
  const value = custom?.storageCdnUrl;
  return typeof value === "string" ? value.replace(/\/+$/, "") : "";
})();

export const assetImagePrefix = (assetId: string) =>
  `public/assets/${assetId}/images/`;

export const assetDocPrefix = (assetId: string) =>
  `private/assets/${assetId}/docs/`;

export const blogCoverPrefix = (postId: string) =>
  `public/blog/${postId}/cover/`;

export const toSafeFileName = (name: string) =>
  name
    .trim()
    .replace(/[^\w.-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120) || "file";

export const extractPublicPath = (value: string) => {
  if (!value) return "";
  const trimmed = value.trim();
  if (trimmed.startsWith("public/")) return trimmed;
  if (trimmed.startsWith("/public/")) return trimmed.slice(1);
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    try {
      const url = new URL(trimmed);
      const publicIndex = url.pathname.indexOf("/public/");
      if (publicIndex >= 0) {
        return url.pathname.slice(publicIndex + 1);
      }
    } catch {
      return "";
    }
  }
  return "";
};

export const normalizeStoredPublicPath = (value: string) =>
  extractPublicPath(value) || value.trim();

export const toPublicStorageUrl = (value: string) => {
  const publicPath = extractPublicPath(value);
  if (storageCdnUrl && publicPath) {
    return `${storageCdnUrl}/${publicPath}`;
  }
  return value;
};

export const toPublicStorageUrls = (values: string[]) =>
  values.filter(Boolean).map(toPublicStorageUrl);
