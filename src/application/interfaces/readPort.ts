import type { Asset, Listing, Order, Product } from "@/src/domain/entities";

export interface ReadPort {
  listAssets: () => Promise<Asset[]>;
  getAssetById: (assetId: string) => Promise<Asset | null>;
  getListingById: (listingId: string) => Promise<Listing | null>;
  getOrderById: (orderId: string) => Promise<Order | null>;
  listListingsByAssetId: (assetId: string) => Promise<Listing[]>;
  listProductsByListingId: (listingId: string) => Promise<Product[]>;
  getProductById: (productId: string) => Promise<Product | null>;
  listOrdersByInvestor: (investorId: string) => Promise<Order[]>;
  listOrdersByProvider: (providerUserId: string) => Promise<Order[]>;
}
