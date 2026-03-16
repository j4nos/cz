import type { InvestmentRepository } from "@/src/domain/repositories/investmentRepository";
import type {
  Asset,
  Listing,
  MintRequest,
  Order,
  Product,
  UserProfile,
} from "@/src/domain/entities";

export class InMemoryInvestmentRepository implements InvestmentRepository {
  private readonly userProfiles = new Map<string, UserProfile>();
  private readonly assets = new Map<string, Asset>();
  private readonly listings = new Map<string, Listing>();
  private readonly products = new Map<string, Product>();
  private readonly orders = new Map<string, Order>();
  private readonly mintRequests = new Map<string, MintRequest>();

  async createUserProfile(input: UserProfile): Promise<UserProfile> {
    this.userProfiles.set(input.id, { ...input });
    return { ...input };
  }

  async getUserProfileById(id: string): Promise<UserProfile | null> {
    return this.copyOrNull(this.userProfiles.get(id));
  }

  async updateUserProfile(input: UserProfile): Promise<UserProfile> {
    this.userProfiles.set(input.id, { ...input });
    return { ...input };
  }

  async createAsset(input: Asset): Promise<Asset> {
    this.assets.set(input.id, { ...input });
    return { ...input };
  }

  async getAssetById(id: string): Promise<Asset | null> {
    return this.copyOrNull(this.assets.get(id));
  }

  async updateAsset(asset: Asset): Promise<Asset> {
    this.assets.set(asset.id, { ...asset });
    return { ...asset };
  }

  async deleteAsset(assetId: string): Promise<void> {
    this.assets.delete(assetId);
  }

  async createListing(input: Listing): Promise<Listing> {
    this.listings.set(input.id, { ...input });
    return { ...input };
  }

  async getListingById(id: string): Promise<Listing | null> {
    return this.copyOrNull(this.listings.get(id));
  }

  async deleteListing(listingId: string): Promise<void> {
    this.listings.delete(listingId);
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

  async deleteProduct(productId: string): Promise<void> {
    this.products.delete(productId);
  }

  async createOrder(input: Order): Promise<Order> {
    this.orders.set(input.id, { ...input });
    return { ...input };
  }

  async getOrderById(id: string): Promise<Order | null> {
    return this.copyOrNull(this.orders.get(id));
  }

  async findOrderByPaymentProviderId(paymentProviderId: string): Promise<Order | null> {
    for (const order of Array.from(this.orders.values())) {
      if (order.paymentProviderId === paymentProviderId) {
        return { ...order };
      }
    }

    return null;
  }

  async getMintRequestById(id: string): Promise<MintRequest | null> {
    return this.copyOrNull(this.mintRequests.get(id));
  }

  async createMintRequestIfMissing(input: {
    requestId: string;
    orderId: string;
    assetId: string;
    idempotencyKey: string;
    walletAddress?: string;
    createdAt: string;
  }): Promise<{ request: MintRequest | null; created: boolean }> {
    const existing = this.mintRequests.get(input.requestId);
    if (existing) {
      return { request: { ...existing }, created: false };
    }

    const request: MintRequest = {
      id: input.requestId,
      orderId: input.orderId,
      assetId: input.assetId,
      idempotencyKey: input.idempotencyKey,
      mintStatus: "queued",
      walletAddress: input.walletAddress,
      retryCount: 0,
      createdAt: input.createdAt,
      updatedAt: input.createdAt,
    };
    this.mintRequests.set(input.requestId, request);
    return { request: { ...request }, created: true };
  }

  async updateMintRequest(input: MintRequest): Promise<MintRequest> {
    this.mintRequests.set(input.id, { ...input });
    return { ...input };
  }

  async updateOrder(order: Order): Promise<Order> {
    this.orders.set(order.id, { ...order });
    return { ...order };
  }

  private copyOrNull<T>(value: T | undefined): T | null {
    return value ? { ...value } : null;
  }
}
