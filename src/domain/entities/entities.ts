export type UserRole = "ASSET_PROVIDER" | "INVESTOR" | "platform-admin";

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
export type ContractDeploymentStatus = "queued" | "submitting" | "submitted" | "failed";
export type MintRequestStatus = "queued" | "submitting" | "submitted" | "minted" | "failed";

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
  coupons: ProductCoupon[];
}

export interface ProductCoupon {
  code: string;
  discountedUnitPrice: number;
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
  notes?: string;
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

export interface ContractDeploymentRequest {
  id: string;
  assetId: string;
  idempotencyKey: string;
  deploymentStatus: ContractDeploymentStatus;
  runId: string;
  tokenStandard?: string;
  tokenAddress?: string;
  errorCode?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MintRequest {
  id: string;
  orderId: string;
  assetId: string;
  idempotencyKey: string;
  mintStatus: MintRequestStatus;
  walletAddress?: string;
  blockchainTxHash?: string;
  tokenId?: string;
  retryCount: number;
  errorCode?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}
