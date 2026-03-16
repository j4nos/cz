import type {
  Asset,
  Listing,
  MintRequest,
  Order,
  Product,
  UserProfile,
} from "@/src/domain/entities";

export interface InvestmentRepository {
  createUserProfile(input: UserProfile): Promise<UserProfile>;
  getUserProfileById(id: string): Promise<UserProfile | null>;
  updateUserProfile(input: UserProfile): Promise<UserProfile>;
  createAsset(input: Asset): Promise<Asset>;
  getAssetById(id: string): Promise<Asset | null>;
  updateAsset(input: Asset): Promise<Asset>;
  deleteAsset(assetId: string): Promise<void>;
  createListing(input: Listing): Promise<Listing>;
  getListingById(id: string): Promise<Listing | null>;
  deleteListing(listingId: string): Promise<void>;
  createProduct(input: Product): Promise<Product>;
  getProductById(id: string): Promise<Product | null>;
  updateProduct(product: Product): Promise<Product>;
  deleteProduct(productId: string): Promise<void>;
  createOrder(input: Order): Promise<Order>;
  getOrderById(id: string): Promise<Order | null>;
  findOrderByPaymentProviderId(paymentProviderId: string): Promise<Order | null>;
  getMintRequestById(id: string): Promise<MintRequest | null>;
  createMintRequestIfMissing(input: {
    requestId: string;
    orderId: string;
    assetId: string;
    idempotencyKey: string;
    walletAddress?: string;
    createdAt: string;
  }): Promise<{ request: MintRequest | null; created: boolean }>;
  updateMintRequest(input: MintRequest): Promise<MintRequest>;
  updateOrder(order: Order): Promise<Order>;
}
