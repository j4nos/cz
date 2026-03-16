import type { BlogPost } from "@/src/domain/entities/content";
import type { Product } from "@/src/domain/entities";
import type { PublicContentReader, PublicListingWithAsset } from "@/src/application/use-cases/publicContent";

type PublicContentRepository = {
  listListings(): Promise<PublicListingWithAsset["listing"][]>;
  listAssets(): Promise<Array<NonNullable<PublicListingWithAsset["asset"]>>>;
  getListingById(listingId: string): Promise<PublicListingWithAsset["listing"] | null>;
  getAssetById(assetId: string): Promise<PublicListingWithAsset["asset"]>;
  listProductsByListingId(listingId: string): Promise<Product[]>;
  getProductById(productId: string): Promise<Product | null>;
  getOrderById(orderId: string): Promise<Awaited<ReturnType<PublicContentReader["getOrderById"]>>>;
  listPublishedBlogPosts(): Promise<BlogPost[]>;
};

export class AmplifyPublicContentReader implements PublicContentReader {
  constructor(private readonly repository: PublicContentRepository) {}

  async listOpenListingsWithAssets(): Promise<PublicListingWithAsset[]> {
    const [listings, assets] = await Promise.all([this.repository.listListings(), this.repository.listAssets()]);
    const assetById = new Map(assets.map((asset) => [asset.id, asset]));

    return listings
      .filter((listing) => listing.saleStatus === "open")
      .map((listing) => ({
        listing,
        asset: assetById.get(listing.assetId) ?? null,
      }));
  }

  async getOpenListingWithAssetById(listingId: string): Promise<PublicListingWithAsset | null> {
    const entry = await this.getListingWithAssetById(listingId);
    if (!entry || entry.listing.saleStatus !== "open") {
      return null;
    }

    return entry;
  }

  async getListingWithAssetById(listingId: string): Promise<PublicListingWithAsset | null> {
    const listing = await this.repository.getListingById(listingId);
    if (!listing) {
      return null;
    }

    const asset = await this.repository.getAssetById(listing.assetId);
    return {
      listing,
      asset,
    };
  }

  async listProductsByListingId(listingId: string): Promise<Product[]> {
    return this.repository.listProductsByListingId(listingId);
  }

  async getProductById(productId: string): Promise<Product | null> {
    return this.repository.getProductById(productId);
  }

  async getOrderById(orderId: string) {
    return this.repository.getOrderById(orderId);
  }

  async listPublishedBlogPosts(): Promise<BlogPost[]> {
    return this.repository.listPublishedBlogPosts();
  }

  async getPublishedBlogPostById(blogId: string): Promise<BlogPost | null> {
    const posts = await this.repository.listPublishedBlogPosts();
    return posts.find((post) => post.id === blogId) ?? null;
  }
}
