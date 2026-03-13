"use client";

import type { Asset, Listing, Order, Product, UserProfile } from "@/src/domain/entities";
import { assets, blogPosts, listings, products, seedOrders, users, type AssetDocument } from "@/src/ui/mockData";
import type { ProductPricingState, PricingTier } from "@/src/ui/localPricing";

export interface LocalAsset extends Asset {
  documents: AssetDocument[];
}

export interface LocalListing extends Listing {
  description: string;
  assetName: string;
  imageUrls: string[];
  startsAt?: string;
  endsAt?: string;
}

export interface LocalDb {
  users: UserProfile[];
  assets: LocalAsset[];
  listings: LocalListing[];
  products: Product[];
  orders: Order[];
  blogPosts: typeof blogPosts;
  pricingByListingId: Record<string, ProductPricingState>;
}

const STORAGE_KEY = "cityzeen.local-db";

function isBrowser() {
  return typeof window !== "undefined";
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function buildSeedDb(): LocalDb {
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
    listings: clone(listings).map((listing) => ({
      ...listing,
      startsAt: "",
      endsAt: "",
    })),
    products: clone(products),
    orders: clone(seedOrders),
    blogPosts: clone(blogPosts),
    pricingByListingId,
  };
}

export function getLocalDb(): LocalDb {
  const seed = buildSeedDb();

  if (!isBrowser()) {
    return seed;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return seed;
  }

  try {
    const parsed = JSON.parse(raw) as LocalDb;
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

export function saveLocalDb(db: LocalDb) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

export function getAllAssetsFromDb() {
  return getLocalDb().assets;
}

export function getAssetByIdFromDb(assetId: string) {
  return getLocalDb().assets.find((asset) => asset.id === assetId) ?? null;
}

export function upsertAssetInDb(asset: LocalAsset) {
  const db = getLocalDb();
  const index = db.assets.findIndex((current) => current.id === asset.id);

  if (index >= 0) {
    db.assets[index] = asset;
  } else {
    db.assets.push(asset);
  }

  saveLocalDb(db);
}

export function getListingsByAssetIdFromDb(assetId: string) {
  return getLocalDb().listings.filter((listing) => listing.assetId === assetId);
}

export function getListingByIdFromDb(listingId: string) {
  return getLocalDb().listings.find((listing) => listing.id === listingId) ?? null;
}

export function upsertListingInDb(listing: LocalListing) {
  const db = getLocalDb();
  const index = db.listings.findIndex((current) => current.id === listing.id);

  if (index >= 0) {
    db.listings[index] = listing;
  } else {
    db.listings.push(listing);
  }

  saveLocalDb(db);
}

export function deleteListingFromDb(listingId: string) {
  const db = getLocalDb();
  db.listings = db.listings.filter((listing) => listing.id !== listingId);
  db.products = db.products.filter((product) => product.listingId !== listingId);
  delete db.pricingByListingId[listingId];
  saveLocalDb(db);
}

export function getProductsByListingIdFromDb(listingId: string) {
  return getLocalDb().products.filter((product) => product.listingId === listingId);
}

export function getProductByListingIdFromDb(listingId: string) {
  return getProductsByListingIdFromDb(listingId)[0] ?? null;
}

export function upsertProductInDb(product: Product) {
  const db = getLocalDb();
  const index = db.products.findIndex((current) => current.id === product.id);

  if (index >= 0) {
    db.products[index] = product;
  } else {
    db.products.push(product);
  }

  saveLocalDb(db);
}

export function deleteProductFromDb(productId: string) {
  const db = getLocalDb();
  db.products = db.products.filter((product) => product.id !== productId);
  saveLocalDb(db);
}

export function getPricingStateFromDb(listingId: string) {
  const db = getLocalDb();
  const stored = db.pricingByListingId[listingId];
  if (stored) {
    return stored;
  }

  const product = getProductByListingIdFromDb(listingId);

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
    ] satisfies PricingTier[],
  };
}

export function savePricingStateToDb(state: ProductPricingState) {
  const db = getLocalDb();
  db.pricingByListingId[state.listingId] = state;

  upsertProductInDb({
    id: state.productId,
    listingId: state.listingId,
    name: state.name,
    currency: state.currency,
    unitPrice: state.unitPrice,
    minPurchase: state.minPurchase,
    maxPurchase: state.maxPurchase,
    eligibleInvestorType: state.eligibleInvestorType,
    supplyTotal: state.supplyTotal,
    remainingSupply: state.supplyTotal,
  });

  const refreshed = getLocalDb();
  refreshed.pricingByListingId[state.listingId] = state;
  saveLocalDb(refreshed);
}
