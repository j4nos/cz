export type UserRole = "ASSET_PROVIDER" | "INVESTOR";

export type KycStatus = "PENDING" | "APPROVED";

export type SaleStatus = "DRAFT" | "OPEN" | "CLOSED";

export type OrderStatus = "PENDING_PAYMENT" | "COMPLETED";

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
  tokenStandard?: string;
  status: string;
  missingDocsCount: number;
  tokenAddress?: string;
  latestRunId?: string;
}

export interface Listing {
  id: string;
  assetId: string;
  title: string;
  assetClass: string;
  eligibility: string;
  currency: string;
  fromPrice: number;
  saleStatus: SaleStatus;
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
  quantity: number;
  unitPrice: number;
  total: number;
  status: OrderStatus;
  currency: string;
  investorWalletAddress?: string;
}
