import type { InvestmentRepository } from "@/src/application/ports";
import type { Asset, Listing, Order, Product, UserProfile } from "@/src/domain/entities";

export class InMemoryInvestmentRepository implements InvestmentRepository {
  private readonly userProfiles = new Map<string, UserProfile>();
  private readonly assets = new Map<string, Asset>();
  private readonly listings = new Map<string, Listing>();
  private readonly products = new Map<string, Product>();
  private readonly orders = new Map<string, Order>();

  async createUserProfile(input: UserProfile): Promise<UserProfile> {
    this.userProfiles.set(input.id, { ...input });
    return { ...input };
  }

  async getUserProfileById(id: string): Promise<UserProfile | null> {
    return this.copyOrNull(this.userProfiles.get(id));
  }

  async createAsset(input: Asset): Promise<Asset> {
    this.assets.set(input.id, { ...input });
    return { ...input };
  }

  async getAssetById(id: string): Promise<Asset | null> {
    return this.copyOrNull(this.assets.get(id));
  }

  async createListing(input: Listing): Promise<Listing> {
    this.listings.set(input.id, { ...input });
    return { ...input };
  }

  async getListingById(id: string): Promise<Listing | null> {
    return this.copyOrNull(this.listings.get(id));
  }

  async createProduct(input: Product): Promise<Product> {
    this.products.set(input.id, { ...input });
    return { ...input };
  }

  async getProductById(id: string): Promise<Product | null> {
    return this.copyOrNull(this.products.get(id));
  }

  async updateProduct(product: Product): Promise<Product> {
    this.products.set(product.id, { ...product });
    return { ...product };
  }

  async createOrder(input: Order): Promise<Order> {
    this.orders.set(input.id, { ...input });
    return { ...input };
  }

  async getOrderById(id: string): Promise<Order | null> {
    return this.copyOrNull(this.orders.get(id));
  }

  async updateOrder(order: Order): Promise<Order> {
    this.orders.set(order.id, { ...order });
    return { ...order };
  }

  private copyOrNull<T>(value: T | undefined): T | null {
    return value ? { ...value } : null;
  }
}
