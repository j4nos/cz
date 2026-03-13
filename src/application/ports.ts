import type { Asset, Listing, Order, Product, UserProfile } from "@/src/domain/entities";

export interface InvestmentRepository {
  createUserProfile(input: UserProfile): Promise<UserProfile>;
  getUserProfileById(id: string): Promise<UserProfile | null>;
  createAsset(input: Asset): Promise<Asset>;
  getAssetById(id: string): Promise<Asset | null>;
  createListing(input: Listing): Promise<Listing>;
  getListingById(id: string): Promise<Listing | null>;
  createProduct(input: Product): Promise<Product>;
  getProductById(id: string): Promise<Product | null>;
  updateProduct(product: Product): Promise<Product>;
  createOrder(input: Order): Promise<Order>;
  getOrderById(id: string): Promise<Order | null>;
  updateOrder(order: Order): Promise<Order>;
}
