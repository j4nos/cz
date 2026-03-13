import type { Asset, Listing, Order, Product, UserProfile } from "@/src/domain/entities";

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
  updateOrder(order: Order): Promise<Order>;
}
