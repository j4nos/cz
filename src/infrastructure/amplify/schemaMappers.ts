import type { Schema } from "@/amplify/data/resource";
import type { AssetDocument, BlogPost } from "@/src/domain/entities/content";
import type {
  Asset,
  EligibleInvestorType,
  InvestorType,
  Listing,
  Order,
  Product,
  ProductCoupon,
  UserProfile,
} from "@/src/domain/entities";
import { sanitizeProductCoupons } from "@/src/application/use-cases/productCoupons";
import { toPublicStorageUrl, toPublicStorageUrls } from "@/src/infrastructure/storage/publicUrls";

function normalizeAssetStatus(value?: string): Asset["status"] {
  switch ((value ?? "").toLowerCase()) {
    case "draft":
      return "draft";
    case "submitted":
      return "submitted";
    case "approved":
      return "approved";
    case "pending":
      return "pending";
    case "closed":
      return "closed";
    default:
      return "draft";
  }
}

function normalizeOrderStatus(value?: string): Order["status"] {
  switch ((value ?? "").toLowerCase()) {
    case "pending_payment":
      return "pending";
    case "completed":
      return "paid";
    case "pending":
      return "pending";
    case "paid":
      return "paid";
    case "cancelled":
      return "cancelled";
    case "failed":
      return "failed";
    default:
      return "pending";
  }
}

function normalizeInvestorType(value?: string): InvestorType | undefined {
  switch ((value ?? "").toUpperCase()) {
    case "RETAIL":
      return "RETAIL";
    case "ACCREDITED":
    case "PRO":
    case "PROFESSIONAL":
      return "PROFESSIONAL";
    default:
      return undefined;
  }
}

function normalizeEligibleInvestorType(value?: string): EligibleInvestorType {
  switch ((value ?? "").toUpperCase()) {
    case "RETAIL":
      return "RETAIL";
    case "ACCREDITED":
    case "PRO":
    case "PROFESSIONAL":
      return "PROFESSIONAL";
    case "ANY":
    default:
      return "ANY";
  }
}

export type AssetRecord = Asset & {
  documents: AssetDocument[];
  beneficiaryIban?: string;
  beneficiaryLabel?: string;
};

export function mapUserProfileRecord(item: Schema["UserProfile"]["type"]): UserProfile {
  return {
    id: item.id,
    email: item.email ?? "",
    role: (item.role as UserProfile["role"]) ?? "INVESTOR",
    country: item.country ?? "",
    investorType: normalizeInvestorType(item.investorType ?? undefined),
    companyName: item.companyName ?? undefined,
    kycStatus: item.kycStatus
      ? (item.kycStatus.toLowerCase() as UserProfile["kycStatus"])
      : "pending",
    createdAt: item.createdAt ?? new Date(0).toISOString(),
    updatedAt: item.updatedAt ?? item.createdAt ?? new Date(0).toISOString(),
  };
}

export function mapAssetRecord(item: Schema["Asset"]["type"]): AssetRecord {
  return {
    id: item.id,
    tenantUserId: item.tenantUserId ?? "",
    name: item.name ?? "",
    country: item.country ?? "",
    assetClass: item.assetClass ?? "",
    tokenStandard: item.tokenStandard ?? undefined,
    status: normalizeAssetStatus(item.status ?? undefined),
    missingDocsCount: Number(item.missingDocsCount ?? 0),
    tokenAddress: item.tokenAddress ?? undefined,
    latestRunId: item.latestRunId ?? undefined,
    imageUrls: Array.isArray(item.imageUrls)
      ? toPublicStorageUrls(item.imageUrls.filter((value): value is string => typeof value === "string"))
      : [],
    beneficiaryIban: item.beneficiaryIban ?? undefined,
    beneficiaryLabel: item.beneficiaryLabel ?? undefined,
    documents: [],
  };
}

export function mapListingRecord(item: Schema["Listing"]["type"]): Listing {
  return {
    id: item.id,
    assetId: item.assetId ?? "",
    title: item.title ?? "",
    description: item.description ?? "",
    assetClass: item.assetClass ?? "",
    eligibility: item.eligibility ?? "ANY",
    currency: item.currency ?? "EUR",
    fromPrice: Number(item.fromPrice ?? 0),
    saleStatus: item.saleStatus
      ? (item.saleStatus.toLowerCase() as Listing["saleStatus"])
      : "draft",
    startsAt: item.saleStartDate ?? undefined,
    endsAt: item.saleEndDate ?? undefined,
  };
}

export function mapProductCouponRecord(item: Schema["ProductCoupon"]["type"]): ProductCoupon {
  return {
    code: item.code ?? "",
    discountedUnitPrice: Number(item.discountedUnitPrice ?? 0),
  };
}

export function mapProductRecord(
  item: Schema["Product"]["type"],
  coupons: Array<Partial<ProductCoupon> | null | undefined> = [],
): Product {
  return {
    id: item.id,
    listingId: item.listingId ?? "",
    name: item.name ?? "",
    currency: item.currency ?? "EUR",
    unitPrice: Number(item.unitPrice ?? 0),
    minPurchase: Number(item.minPurchase ?? 0),
    maxPurchase: Number(item.maxPurchase ?? 0),
    eligibleInvestorType: normalizeEligibleInvestorType(item.eligibleInvestorType ?? undefined),
    supplyTotal: Number(item.supplyTotal ?? 0),
    remainingSupply: Number(item.remainingSupply ?? 0),
    coupons: sanitizeProductCoupons(coupons),
  };
}

export function mapOrderRecord(item: Schema["Order"]["type"]): Order {
  return {
    id: item.id,
    investorId: item.investorId ?? "",
    providerUserId: item.providerUserId ?? "",
    listingId: item.listingId ?? "",
    productId: item.productId ?? "",
    productName: item.productName ?? undefined,
    quantity: Number(item.quantity ?? 0),
    unitPrice: Number(item.unitPrice ?? 0),
    baseUnitPrice: item.baseUnitPrice == null ? undefined : Number(item.baseUnitPrice),
    discountPctApplied: item.discountPctApplied == null ? undefined : Number(item.discountPctApplied),
    effectiveUnitPrice: item.effectiveUnitPrice == null ? undefined : Number(item.effectiveUnitPrice),
    description: item.description ?? undefined,
    notes: item.description ?? undefined,
    total: Number(item.total ?? 0),
    status: normalizeOrderStatus(item.status ?? undefined),
    currency: item.currency ?? "EUR",
    paymentProvider: item.paymentProvider ?? undefined,
    paymentProviderId: item.paymentProviderId ?? undefined,
    paymentProviderStatus: item.paymentProviderStatus ?? undefined,
    coupon: item.coupon ?? undefined,
    requiresProviderConfirmation: item.requiresProviderConfirmation ?? undefined,
    createdAt: item.createdAt ?? undefined,
    withdrawnAt: item.withdrawnAt ?? undefined,
    providerConfirmedBy: item.providerConfirmedBy ?? undefined,
    providerConfirmedAt: item.providerConfirmedAt ?? undefined,
    investorWalletAddress: item.investorWalletAddress ?? undefined,
    mintRequestedAt: item.mintRequestedAt ?? undefined,
    mintingAt: item.mintingAt ?? undefined,
    mintTxHash: item.mintTxHash ?? undefined,
    mintError: item.mintError ?? undefined,
    mintedAt: item.mintedAt ?? undefined,
  };
}

export function mapBlogPostRecord(item: Schema["BlogPost"]["type"]): BlogPost {
  return {
    id: item.id,
    title: item.title ?? "",
    excerpt: item.excerpt ?? "",
    coverImage: item.coverImage ? toPublicStorageUrl(item.coverImage) : "",
    contentHtml: item.contentHtml ?? "",
    publishedAt: item.publishedAt ?? "",
    status: item.status === "published" ? "published" : "draft",
    updatedAt: item.updatedAt ?? "",
  };
}
