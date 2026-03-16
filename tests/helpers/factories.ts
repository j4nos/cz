import type {
  Asset,
  ContractDeploymentRequest,
  Listing,
  MintRequest,
  Order,
  Product,
  UserProfile,
} from "@/src/domain/entities";
import type { BlogPost } from "@/src/domain/entities/content";

export function makeUserProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    id: "user-1",
    email: "user@example.com",
    role: "INVESTOR",
    country: "HU",
    kycStatus: "approved",
    createdAt: "2026-03-16T00:00:00.000Z",
    updatedAt: "2026-03-16T00:00:00.000Z",
    ...overrides,
  };
}

export function makeAsset(overrides: Partial<Asset> = {}): Asset {
  return {
    id: "asset-1",
    tenantUserId: "provider-1",
    name: "Budapest Office",
    country: "HU",
    assetClass: "REAL_ESTATE",
    tokenStandard: "ERC-20",
    status: "draft",
    missingDocsCount: 0,
    imageUrls: ["/asset.jpg"],
    ...overrides,
  };
}

export function makeListing(overrides: Partial<Listing> = {}): Listing {
  return {
    id: "listing-1",
    assetId: "asset-1",
    title: "Listing title",
    description: "Listing description",
    assetClass: "REAL_ESTATE",
    eligibility: "ANY",
    currency: "EUR",
    fromPrice: 100,
    saleStatus: "open",
    startsAt: "2026-03-10",
    endsAt: "2026-03-20",
    ...overrides,
  };
}

export function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: "product-1",
    listingId: "listing-1",
    name: "Fraction",
    currency: "EUR",
    unitPrice: 100,
    minPurchase: 1,
    maxPurchase: 5,
    eligibleInvestorType: "ANY",
    supplyTotal: 100,
    remainingSupply: 100,
    ...overrides,
  };
}

export function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: "order-1",
    investorId: "investor-1",
    providerUserId: "provider-1",
    listingId: "listing-1",
    productId: "product-1",
    quantity: 2,
    unitPrice: 100,
    total: 200,
    status: "pending",
    currency: "EUR",
    ...overrides,
  };
}

export function makeMintRequest(overrides: Partial<MintRequest> = {}): MintRequest {
  return {
    id: "mint:order-1",
    orderId: "order-1",
    assetId: "asset-1",
    idempotencyKey: "mint:order-1",
    mintStatus: "queued",
    retryCount: 0,
    createdAt: "2026-03-16T08:00:00.000Z",
    updatedAt: "2026-03-16T08:00:00.000Z",
    ...overrides,
  };
}

export function makeContractDeploymentRequest(
  overrides: Partial<ContractDeploymentRequest> = {},
): ContractDeploymentRequest {
  return {
    id: "contract-deployment:asset-1",
    assetId: "asset-1",
    idempotencyKey: "contract-deployment:asset-1",
    deploymentStatus: "queued",
    runId: "run-1",
    tokenStandard: "erc-20",
    createdAt: "2026-03-16T00:00:00.000Z",
    updatedAt: "2026-03-16T00:00:00.000Z",
    ...overrides,
  };
}

export function makeBlogPost(overrides: Partial<BlogPost> = {}): BlogPost {
  return {
    id: "blog-1",
    title: "Market update",
    excerpt: "Excerpt",
    coverImage: "https://example.com/cover.jpg",
    contentHtml: "<p>Hello</p>",
    publishedAt: "2026-03-16",
    status: "draft",
    updatedAt: "2026-03-16T00:00:00.000Z",
    ...overrides,
  };
}