import type { BlogPost } from "@/src/domain/entities/content";
import type { Asset, Listing, Order, Product } from "@/src/domain/entities";

export type PublicListingWithAsset = {
  listing: Listing;
  asset: Asset | null;
};

export interface PublicContentReader {
  listOpenListingsWithAssets: () => Promise<PublicListingWithAsset[]>;
  getListingWithAssetById: (listingId: string) => Promise<PublicListingWithAsset | null>;
  getOpenListingWithAssetById: (listingId: string) => Promise<PublicListingWithAsset | null>;
  listProductsByListingId: (listingId: string) => Promise<Product[]>;
  getProductById: (productId: string) => Promise<Product | null>;
  getOrderById: (orderId: string) => Promise<Order | null>;
  listPublishedBlogPosts: () => Promise<BlogPost[]>;
  getPublishedBlogPostById: (blogId: string) => Promise<BlogPost | null>;
}

export async function listPublicListings(reader: PublicContentReader): Promise<PublicListingWithAsset[]> {
  return reader.listOpenListingsWithAssets();
}

export async function getPublicListingDetails(
  reader: PublicContentReader,
  listingId: string,
): Promise<{ listingWithAsset: PublicListingWithAsset | null; products: Product[] }> {
  const listingWithAsset = await reader.getOpenListingWithAssetById(listingId);
  if (!listingWithAsset) {
    return { listingWithAsset: null, products: [] };
  }

  const products = await reader.listProductsByListingId(listingId);
  return { listingWithAsset, products };
}

export async function listPublicBlogPosts(reader: PublicContentReader): Promise<BlogPost[]> {
  return reader.listPublishedBlogPosts();
}

export async function getPublicBlogPost(reader: PublicContentReader, blogId: string): Promise<BlogPost | null> {
  return reader.getPublishedBlogPostById(blogId);
}

export async function getInvestorOrderEntry(
  reader: PublicContentReader,
  orderId: string,
): Promise<{
  order: Order | null;
  listingWithAsset: PublicListingWithAsset | null;
  product: Product | null;
}> {
  const order = await reader.getOrderById(orderId);
  if (!order) {
    return { order: null, listingWithAsset: null, product: null };
  }

  const [listingWithAsset, product] = await Promise.all([
    reader.getListingWithAssetById(order.listingId),
    reader.getProductById(order.productId),
  ]);

  return { order, listingWithAsset, product };
}
