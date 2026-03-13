"use client";

import type { Asset, Listing, Order, Product, UserProfile } from "@/src/domain/entities";
import { assets, blogPosts, listings, products, seedOrders, users, type AssetDocument } from "@/src/ui/mockData";

export interface PricingTier {
  id: string;
  minQuantity: number;
  discountPercent: number;
}

export interface ProductPricingState {
  productId: string;
  listingId: string;
  name: string;
  currency: string;
  unitPrice: number;
  minPurchase: number;
  maxPurchase: number;
  eligibleInvestorType: string;
  supplyTotal: number;
  tiers: PricingTier[];
}

export interface AssetRecord extends Asset {
  documents: AssetDocument[];
}

export interface ListingWithAssetView {
  listing: Listing;
  asset: AssetRecord | null;
}

export interface DemoStore {
  users: UserProfile[];
  assets: AssetRecord[];
  listings: Listing[];
  products: Product[];
  orders: Order[];
  blogPosts: typeof blogPosts;
  pricingByListingId: Record<string, ProductPricingState>;
}

const STORAGE_KEY = "cityzeen.local-db";

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function isBrowser() {
  return typeof window !== "undefined";
}

export function buildSeedStore(): DemoStore {
  const pricingByListingId: Record<string, ProductPricingState> = {};

  for (const product of products) {
    pricingByListingId[product.listingId] = {
      productId: product.id,
      listingId: product.listingId,
      name: product.name,
      currency: product.currency,
      unitPrice: product.unitPrice,
      minPurchase: product.minPurchase,
      maxPurchase: product.maxPurchase,
      eligibleInvestorType: product.eligibleInvestorType,
      supplyTotal: product.supplyTotal,
      tiers: [
        {
          id: `${product.listingId}-tier-1`,
          minQuantity: 5,
          discountPercent: 0,
        },
      ],
    };
  }

  return {
    users: clone(users),
    assets: clone(assets),
    listings: clone(listings).map(({ assetName: _assetName, imageUrls: _imageUrls, ...listing }) => listing),
    products: clone(products),
    orders: clone(seedOrders),
    blogPosts: clone(blogPosts),
    pricingByListingId,
  };
}

export function readDemoStore(): DemoStore {
  const seed = buildSeedStore();

  if (!isBrowser()) {
    return seed;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return seed;
  }

  try {
    const parsed = JSON.parse(raw) as DemoStore;
    return {
      ...seed,
      ...parsed,
      users: Array.isArray(parsed.users) ? parsed.users : seed.users,
      assets: Array.isArray(parsed.assets) ? parsed.assets : seed.assets,
      listings: Array.isArray(parsed.listings) ? parsed.listings : seed.listings,
      products: Array.isArray(parsed.products) ? parsed.products : seed.products,
      orders: Array.isArray(parsed.orders) ? parsed.orders : seed.orders,
      blogPosts: Array.isArray(parsed.blogPosts) ? parsed.blogPosts : seed.blogPosts,
      pricingByListingId:
        parsed.pricingByListingId && typeof parsed.pricingByListingId === "object"
          ? parsed.pricingByListingId
          : seed.pricingByListingId,
    };
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return seed;
  }
}

export function writeDemoStore(store: DemoStore) {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}
