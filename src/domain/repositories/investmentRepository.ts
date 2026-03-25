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
  deleteUserProfile(id: string): Promise<void>;
  createAsset(input: Asset): Promise<Asset>;
  getAssetById(id: string): Promise<Asset | null>;
  updateAsset(input: Asset): Promise<Asset>;
  deleteAsset(assetId: string): Promise<void>;
  listAssets(): Promise<Asset[]>;
  createListing(input: Listing): Promise<Listing>;
  getListingById(id: string): Promise<Listing | null>;
  updateListing(input: Listing): Promise<Listing>;
  deleteListing(listingId: string): Promise<void>;
  listListings(): Promise<Listing[]>;
  createProduct(input: Product): Promise<Product>;
  getProductById(id: string): Promise<Product | null>;
  updateProduct(product: Product): Promise<Product>;
  deleteProduct(productId: string): Promise<void>;
  listProductsByListingId(listingId: string): Promise<Product[]>;
  createOrder(input: Order): Promise<Order>;
  getOrderById(id: string): Promise<Order | null>;
  findOrderByPaymentProviderId(paymentProviderId: string): Promise<Order | null>;
  listOrdersByInvestor(investorId: string): Promise<Order[]>;
  listOrdersByProvider(providerUserId: string): Promise<Order[]>;
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
