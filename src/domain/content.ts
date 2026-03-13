export interface AssetDocument {
  id: string;
  assetId: string;
  name: string;
}

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  coverImage: string;
  contentHtml: string;
  publishedAt: string;
  status: "draft" | "published";
  updatedAt: string;
}
