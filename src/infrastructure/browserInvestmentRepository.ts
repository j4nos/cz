"use client";

import type { InvestmentRepository } from "@/src/application/ports";
import type { Asset, Listing, Order, Product, UserProfile } from "@/src/domain/entities";
import {
  type AssetRecord,
  buildSeedStore,
  type DemoStore,
  type ListingWithAssetView,
  type ProductPricingState,
  readDemoStore,
  writeDemoStore,
} from "@/src/infrastructure/browserDemoStore";

export class BrowserInvestmentRepository implements InvestmentRepository {
  private read(): DemoStore {
    return readDemoStore();
  }

  private write(store: DemoStore) {
    writeDemoStore(store);
  }

  async createUserProfile(input: UserProfile): Promise<UserProfile> {
    const store = this.read();
    store.users.push({ ...input });
    this.write(store);
    return { ...input };
  }

  async getUserProfileById(id: string): Promise<UserProfile | null> {
    return this.copyOrNull(this.read().users.find((user) => user.id === id));
  }

  async createAsset(input: Asset): Promise<Asset> {
    const store = this.read();
    store.assets.push({
      ...input,
      documents: [],
    });
    this.write(store);
    return { ...input };
  }

  async getAssetById(id: string): Promise<Asset | null> {
    const asset = this.read().assets.find((current) => current.id === id);
    return asset ? this.stripAssetRecord(asset) : null;
  }

  async createListing(input: Listing): Promise<Listing> {
    const store = this.read();
    store.listings.push({ ...input });
    this.write(store);
    return { ...input };
  }

  async getListingById(id: string): Promise<Listing | null> {
    const listing = this.read().listings.find((current) => current.id === id);
    return listing ? this.stripListingRecord(listing) : null;
  }

  async createProduct(input: Product): Promise<Product> {
    const store = this.read();
    store.products.push({ ...input });
    this.write(store);
    return { ...input };
  }

  async getProductById(id: string): Promise<Product | null> {
    return this.copyOrNull(this.read().products.find((product) => product.id === id));
  }

  async updateProduct(product: Product): Promise<Product> {
    const store = this.read();
    const index = store.products.findIndex((current) => current.id === product.id);
    if (index >= 0) {
      store.products[index] = { ...product };
    } else {
      store.products.push({ ...product });
    }
    this.write(store);
    return { ...product };
  }

  async createOrder(input: Order): Promise<Order> {
    const store = this.read();
    store.orders.push({ ...input });
    this.write(store);
    return { ...input };
  }

  async getOrderById(id: string): Promise<Order | null> {
    return this.copyOrNull(this.read().orders.find((order) => order.id === id));
  }

  async updateOrder(order: Order): Promise<Order> {
    const store = this.read();
    const index = store.orders.findIndex((current) => current.id === order.id);
    if (index >= 0) {
      store.orders[index] = { ...order };
    } else {
      store.orders.push({ ...order });
    }
    this.write(store);
    return { ...order };
  }

  listAssets(): AssetRecord[] {
    return this.read().assets;
  }

  getAssetRecordById(assetId: string): AssetRecord | null {
    return this.read().assets.find((asset) => asset.id === assetId) ?? null;
  }

  saveAssetRecord(asset: AssetRecord) {
    const store = this.read();
    const index = store.assets.findIndex((current) => current.id === asset.id);
    if (index >= 0) {
      store.assets[index] = asset;
    } else {
      store.assets.push(asset);
    }
    this.write(store);
  }

  listListings(): Listing[] {
    return this.read().listings;
  }

  listListingsWithAsset(): ListingWithAssetView[] {
    const store = this.read();
    return store.listings.map((listing) => {
      const asset = store.assets.find((current) => current.id === listing.assetId);
      return {
        listing,
        asset: asset ?? null,
      };
    });
  }

  listListingsByAssetId(assetId: string): Listing[] {
    return this.read().listings.filter((listing) => listing.assetId === assetId);
  }

  getListingByIdForView(listingId: string): Listing | null {
    return this.read().listings.find((listing) => listing.id === listingId) ?? null;
  }

  getListingWithAssetById(listingId: string): ListingWithAssetView | null {
    return this.listListingsWithAsset().find((entry) => entry.listing.id === listingId) ?? null;
  }

  saveListing(listing: Listing) {
    const store = this.read();
    const index = store.listings.findIndex((current) => current.id === listing.id);
    if (index >= 0) {
      store.listings[index] = listing;
    } else {
      store.listings.push(listing);
    }
    this.write(store);
  }

  deleteListing(listingId: string) {
    const store = this.read();
    store.listings = store.listings.filter((listing) => listing.id !== listingId);
    store.products = store.products.filter((product) => product.listingId !== listingId);
    delete store.pricingByListingId[listingId];
    this.write(store);
  }

  listProductsByListingId(listingId: string): Product[] {
    return this.read().products.filter((product) => product.listingId === listingId);
  }

  deleteProduct(productId: string) {
    const store = this.read();
    store.products = store.products.filter((product) => product.id !== productId);
    this.write(store);
  }

  listOrdersByInvestor(investorId: string): Order[] {
    return this.read().orders.filter((order) => order.investorId === investorId);
  }

  listOrdersByProvider(providerUserId: string): Order[] {
    return this.read().orders.filter((order) => order.providerUserId === providerUserId);
  }

  listPublishedBlogPosts() {
    return this.read().blogPosts.filter((post) => post.status === "published");
  }

  getPublishedBlogPostById(blogId: string) {
    return this.listPublishedBlogPosts().find((post) => post.id === blogId) ?? null;
  }

  getPricingState(listingId: string): ProductPricingState {
    const store = this.read();
    const existing = store.pricingByListingId[listingId];
    if (existing) {
      return existing;
    }

    const product = this.listProductsByListingId(listingId)[0];
    return {
      productId: product?.id ?? `product-${listingId}`,
      listingId,
      name: product?.name ?? "New Product",
      currency: product?.currency ?? "EUR",
      unitPrice: product?.unitPrice ?? 1000,
      minPurchase: product?.minPurchase ?? 1,
      maxPurchase: product?.maxPurchase ?? 10,
      eligibleInvestorType: product?.eligibleInvestorType ?? "ANY",
      supplyTotal: product?.supplyTotal ?? 100,
      tiers: [
        {
          id: `${listingId}-tier-1`,
          minQuantity: 5,
          discountPercent: 0,
        },
      ],
    };
  }

  savePricingState(pricingState: ProductPricingState) {
    const store = this.read();
    store.pricingByListingId[pricingState.listingId] = pricingState;
    this.write(store);
  }

  reset() {
    this.write(buildSeedStore());
  }

  private stripAssetRecord(asset: AssetRecord): Asset {
    const { documents: _documents, ...entity } = asset;
    return entity;
  }

  private stripListingRecord(listing: Listing): Listing {
    return { ...listing };
  }

  private copyOrNull<T>(value: T | undefined): T | null {
    return value ? { ...value } : null;
  }
}
