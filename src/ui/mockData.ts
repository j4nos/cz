import type { Asset, Listing, Order, Product, UserProfile } from "@/src/domain/entities";

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

export interface ListingView extends Listing {
  assetName: string;
  imageUrls: string[];
}

const officeImage =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect width="100%" height="100%" fill="#ddd"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="32">Budapest Office</text></svg>`,
  );

const loftImage =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect width="100%" height="100%" fill="#e5e5e5"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="32">Warsaw Loft</text></svg>`,
  );

export const users: UserProfile[] = [
  {
    id: "provider-1",
    email: "provider@cityzeen.test",
    role: "ASSET_PROVIDER",
    country: "HU",
    companyName: "Cityzeen Assets",
    kycStatus: "APPROVED",
    createdAt: "2026-03-13T10:00:00.000Z",
    updatedAt: "2026-03-13T10:00:00.000Z",
  },
  {
    id: "investor-1",
    email: "investor@cityzeen.test",
    role: "INVESTOR",
    country: "DE",
    investorType: "PROFESSIONAL",
    kycStatus: "APPROVED",
    createdAt: "2026-03-13T10:00:00.000Z",
    updatedAt: "2026-03-13T10:00:00.000Z",
  },
];

export const assets: (Asset & { documents: AssetDocument[] })[] = [
  {
    id: "asset-1",
    tenantUserId: "provider-1",
    name: "Budapest Office",
    country: "HU",
    assetClass: "REAL_ESTATE",
    tokenStandard: "ERC-3643",
    status: "DRAFT",
    missingDocsCount: 0,
    tokenAddress: "0xasset1",
    latestRunId: "run-1",
    imageUrls: [officeImage],
    documents: [{ id: "doc-1", assetId: "asset-1", name: "Prospectus.pdf" }],
  },
  {
    id: "asset-2",
    tenantUserId: "provider-1",
    name: "Warsaw Loft",
    country: "PL",
    assetClass: "REAL_ESTATE",
    tokenStandard: "ERC-3643",
    status: "DRAFT",
    missingDocsCount: 0,
    tokenAddress: "0xasset2",
    latestRunId: "run-2",
    imageUrls: [loftImage],
    documents: [{ id: "doc-2", assetId: "asset-2", name: "Valuation.pdf" }],
  },
];

export const listings: ListingView[] = [
  {
    id: "listing-1",
    assetId: "asset-1",
    title: "Budapest Office Seed Listing",
    description: "Seed round for a Budapest office redevelopment.",
    assetClass: "REAL_ESTATE",
    eligibility: "PROFESSIONAL",
    currency: "EUR",
    fromPrice: 1000,
    saleStatus: "OPEN",
    startsAt: "2026-03-01",
    endsAt: "2026-03-31",
    assetName: "Budapest Office",
    imageUrls: [officeImage],
  },
  {
    id: "listing-2",
    assetId: "asset-2",
    title: "Warsaw Loft Growth Listing",
    description: "Open investment into a Warsaw mixed-use loft conversion.",
    assetClass: "REAL_ESTATE",
    eligibility: "ANY",
    currency: "EUR",
    fromPrice: 750,
    saleStatus: "OPEN",
    startsAt: "2026-03-01",
    endsAt: "2026-03-31",
    assetName: "Warsaw Loft",
    imageUrls: [loftImage],
  },
];

export const products: Product[] = [
  {
    id: "product-1",
    listingId: "listing-1",
    name: "Series A Token",
    currency: "EUR",
    unitPrice: 1000,
    minPurchase: 1,
    maxPurchase: 5,
    eligibleInvestorType: "PROFESSIONAL",
    supplyTotal: 50,
    remainingSupply: 47,
  },
  {
    id: "product-2",
    listingId: "listing-2",
    name: "Common Token",
    currency: "EUR",
    unitPrice: 750,
    minPurchase: 1,
    maxPurchase: 10,
    eligibleInvestorType: "ANY",
    supplyTotal: 120,
    remainingSupply: 120,
  },
];

export const seedOrders: Order[] = [
  {
    id: "order-completed-1",
    investorId: "investor-1",
    providerUserId: "provider-1",
    listingId: "listing-1",
    productId: "product-1",
    quantity: 3,
    unitPrice: 1000,
    total: 3000,
    status: "COMPLETED",
    currency: "EUR",
    investorWalletAddress: "0x123",
  },
];

export const featuredHomepageListings = [
  { assetId: "asset-1", listingId: "listing-1" },
  { assetId: "asset-2", listingId: "listing-2" },
];

export const blogPosts: BlogPost[] = [
  {
    id: "blog-1",
    title: "How tokenized real estate underwriting works",
    excerpt: "A short walkthrough of the underwriting blocks Cityzeen exposes to investors.",
    coverImage: officeImage,
    contentHtml: "<p>Tokenized underwriting still starts with the asset, the sponsor, and the cash flow.</p>",
    publishedAt: "2026-03-10T09:00:00.000Z",
    status: "published",
    updatedAt: "2026-03-11T12:00:00.000Z",
  },
  {
    id: "blog-2",
    title: "Draft post",
    excerpt: "Hidden from the public list.",
    coverImage: loftImage,
    contentHtml: "<p>Draft</p>",
    publishedAt: "2026-03-12T09:00:00.000Z",
    status: "draft",
    updatedAt: "2026-03-12T09:00:00.000Z",
  },
];
