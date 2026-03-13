export type UserRole = "ASSET_PROVIDER" | "INVESTOR";

export type KycStatus =
  | "not-started"
  | "pending"
  | "submitted"
  | "approved"
  | "rejected";

export type AssetStatus =
  | "draft"
  | "submitted"
  | "approved"
  | "pending"
  | "closed";

export type SaleStatus = "draft" | "open" | "closed";

export type OrderStatus = "pending" | "paid" | "cancelled" | "failed";

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  country: string;
  investorType?: string;
  companyName?: string;
  kycStatus: KycStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Asset {
  id: string;
  tenantUserId: string;
  name: string;
  country: string;
  assetClass: string;
  beneficiaryIban?: string;
  beneficiaryLabel?: string;
  tokenStandard?: string;
  status: AssetStatus;
  missingDocsCount: number;
  tokenAddress?: string;
  latestRunId?: string;
  imageUrls: string[];
}

export interface Listing {
  id: string;
  assetId: string;
  title: string;
  description: string;
  assetClass: string;
  eligibility: string;
  currency: string;
  fromPrice: number;
  saleStatus: SaleStatus;
  startsAt?: string;
  endsAt?: string;
}

export interface Product {
  id: string;
  listingId: string;
  name: string;
  currency: string;
  unitPrice: number;
  minPurchase: number;
  maxPurchase: number;
  eligibleInvestorType: string;
  supplyTotal: number;
  remainingSupply: number;
}

export interface Order {
  id: string;
  investorId: string;
  providerUserId: string;
  listingId: string;
  productId: string;
  productName?: string;
  quantity: number;
  unitPrice: number;
  baseUnitPrice?: number;
  discountPctApplied?: number;
  effectiveUnitPrice?: number;
  description?: string;
  total: number;
  status: OrderStatus;
  currency: string;
  paymentProvider?: string;
  paymentProviderId?: string;
  paymentProviderStatus?: string;
  coupon?: string;
  requiresProviderConfirmation?: boolean;
  createdAt?: string;
  withdrawnAt?: string;
  providerConfirmedBy?: string;
  providerConfirmedAt?: string;
  investorWalletAddress?: string;
  mintRequestedAt?: string;
  mintingAt?: string;
  mintTxHash?: string;
  mintError?: string;
  mintedAt?: string;
}
