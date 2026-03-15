import { generateClient } from "aws-amplify/data";

import type { Schema } from "@/amplify/data/resource";
import type { InvestmentRepository } from "@/src/domain/repositories/investmentRepository";
import type { AssetTokenizationRepository } from "@/src/application/interfaces/tokenizationPorts";
import type { BlogPost } from "@/src/domain/entities/content";
import type { Asset, Listing, Order, Product, UserProfile } from "@/src/domain/entities";
import { ensureAmplifyConfigured } from "@/src/config/amplify";
import { listAll } from "@/src/infrastructure/amplify/pagination";
import { normalizeStoredPublicPath } from "@/src/infrastructure/storage/publicUrls";
import {
  mapAssetRecord,
  mapBlogPostRecord,
  mapListingRecord,
  mapOrderRecord,
  mapProductRecord,
  mapUserProfileRecord,
  type AssetRecord,
} from "@/src/infrastructure/amplify/schemaMappers";

export class AmplifyInvestmentRepository
  implements InvestmentRepository, AssetTokenizationRepository
{
  private readonly client;

  constructor() {
    ensureAmplifyConfigured();
    this.client = generateClient<Schema>();
  }

  async createUserProfile(input: UserProfile): Promise<UserProfile> {
    const response = await this.client.models.UserProfile.create({
      id: input.id,
      email: input.email,
      role: input.role,
      country: input.country,
      investorType: input.investorType,
      companyName: input.companyName,
      kycStatus: input.kycStatus,
      createdAt: input.createdAt,
      updatedAt: input.updatedAt,
    });

    return response.data ? mapUserProfileRecord(response.data) : input;
  }

  async getUserProfileById(id: string): Promise<UserProfile | null> {
    const response = await this.client.models.UserProfile.get({ id });
    return response.data ? mapUserProfileRecord(response.data) : null;
  }

  async updateUserProfile(input: UserProfile): Promise<UserProfile> {
    const response = await this.client.models.UserProfile.update({
      id: input.id,
      email: input.email,
      role: input.role,
      country: input.country,
      investorType: input.investorType,
      companyName: input.companyName,
      kycStatus: input.kycStatus,
      createdAt: input.createdAt,
      updatedAt: input.updatedAt,
    });

    return response.data ? mapUserProfileRecord(response.data) : input;
  }

  async createAsset(input: Asset): Promise<Asset> {
    const response = await this.client.models.Asset.create({
      id: input.id,
      tenantUserId: input.tenantUserId,
      name: input.name,
      country: input.country,
      assetClass: input.assetClass,
      beneficiaryIban: input.beneficiaryIban,
      beneficiaryLabel: input.beneficiaryLabel,
      tokenStandard: input.tokenStandard,
      status: input.status,
      missingDocsCount: input.missingDocsCount,
      tokenAddress: input.tokenAddress,
      latestRunId: input.latestRunId,
      imageUrls: input.imageUrls.map(normalizeStoredPublicPath),
    });

    return response.data ? mapAssetRecord(response.data) : input;
  }

  async getAssetById(id: string): Promise<Asset | null> {
    const response = await this.client.models.Asset.get({ id });
    return response.data ? mapAssetRecord(response.data) : null;
  }

  async updateAsset(asset: Asset): Promise<Asset> {
    const response = await this.client.models.Asset.update({
      id: asset.id,
      tenantUserId: asset.tenantUserId,
      name: asset.name,
      country: asset.country,
      assetClass: asset.assetClass,
      beneficiaryIban: asset.beneficiaryIban,
      beneficiaryLabel: asset.beneficiaryLabel,
      tokenStandard: asset.tokenStandard,
      status: asset.status,
      missingDocsCount: asset.missingDocsCount,
      tokenAddress: asset.tokenAddress,
      latestRunId: asset.latestRunId,
      imageUrls: asset.imageUrls.map(normalizeStoredPublicPath),
    });

    return response.data ? mapAssetRecord(response.data) : asset;
  }

  async deleteAsset(assetId: string): Promise<void> {
    await this.client.models.Asset.delete({ id: assetId });
  }

  async updateAssetTokenization(input: {
    assetId: string;
    tokenAddress: string;
    latestRunId: string;
  }): Promise<Asset | null> {
    const current = await this.getAssetById(input.assetId);
    if (!current) {
      return null;
    }

    return this.updateAsset({
      ...current,
      tokenAddress: input.tokenAddress,
      latestRunId: input.latestRunId,
    });
  }

  async createListing(input: Listing): Promise<Listing> {
    const response = await this.client.models.Listing.create({
      id: input.id,
      assetId: input.assetId,
      title: input.title,
      description: input.description,
      assetClass: input.assetClass,
      eligibility: input.eligibility,
      currency: input.currency,
      fromPrice: input.fromPrice,
      saleStatus: input.saleStatus,
      saleStartDate: input.startsAt,
      saleEndDate: input.endsAt,
    });

    return response.data ? mapListingRecord(response.data) : input;
  }

  async getListingById(id: string): Promise<Listing | null> {
    const response = await this.client.models.Listing.get({ id });
    return response.data ? mapListingRecord(response.data) : null;
  }

  async updateListing(listing: Listing): Promise<Listing> {
    const response = await this.client.models.Listing.update({
      id: listing.id,
      assetId: listing.assetId,
      title: listing.title,
      description: listing.description,
      assetClass: listing.assetClass,
      eligibility: listing.eligibility,
      currency: listing.currency,
      fromPrice: listing.fromPrice,
      saleStatus: listing.saleStatus,
      saleStartDate: listing.startsAt,
      saleEndDate: listing.endsAt,
    });

    return response.data ? mapListingRecord(response.data) : listing;
  }

  async deleteListing(listingId: string): Promise<void> {
    await this.client.models.Listing.delete({ id: listingId });
  }

  async createProduct(input: Product): Promise<Product> {
    const response = await this.client.models.Product.create({
      id: input.id,
      listingId: input.listingId,
      name: input.name,
      currency: input.currency,
      unitPrice: input.unitPrice,
      minPurchase: input.minPurchase,
      maxPurchase: input.maxPurchase,
      eligibleInvestorType: input.eligibleInvestorType,
      supplyTotal: input.supplyTotal,
      remainingSupply: input.remainingSupply,
    });

    return response.data ? mapProductRecord(response.data) : input;
  }

  async getProductById(id: string): Promise<Product | null> {
    const response = await this.client.models.Product.get({ id });
    return response.data ? mapProductRecord(response.data) : null;
  }

  async deleteProduct(productId: string): Promise<void> {
    await this.client.models.Product.delete({ id: productId });
  }

  async updateProduct(product: Product): Promise<Product> {
    const response = await this.client.models.Product.update({
      id: product.id,
      name: product.name,
      currency: product.currency,
      unitPrice: product.unitPrice,
      minPurchase: product.minPurchase,
      maxPurchase: product.maxPurchase,
      eligibleInvestorType: product.eligibleInvestorType,
      supplyTotal: product.supplyTotal,
      remainingSupply: product.remainingSupply,
    });

    return response.data ? mapProductRecord(response.data) : product;
  }

  async createOrder(input: Order): Promise<Order> {
    const response = await this.client.models.Order.create({
      id: input.id,
      investorId: input.investorId,
      providerUserId: input.providerUserId,
      listingId: input.listingId,
      productId: input.productId,
      quantity: input.quantity,
      unitPrice: input.unitPrice,
      total: input.total,
      status: input.status,
      currency: input.currency,
      paymentProvider: input.paymentProvider,
      paymentProviderId: input.paymentProviderId,
      paymentProviderStatus: input.paymentProviderStatus,
      investorWalletAddress: input.investorWalletAddress,
    });

    return response.data ? mapOrderRecord(response.data) : input;
  }

  async getOrderById(id: string): Promise<Order | null> {
    const response = await this.client.models.Order.get({ id });
    return response.data ? mapOrderRecord(response.data) : null;
  }

  async findOrderByPaymentProviderId(paymentProviderId: string): Promise<Order | null> {
    const records = await listAll<Schema["Order"]["type"], { nextToken?: string }>((args) =>
      this.client.models.Order.list({
        filter: { paymentProviderId: { eq: paymentProviderId } },
        ...(args ?? {}),
      })
    );

    const [first] = records;
    return first ? mapOrderRecord(first) : null;
  }

  async updateOrder(order: Order): Promise<Order> {
    const response = await this.client.models.Order.update({
      id: order.id,
      status: order.status,
      paymentProvider: order.paymentProvider,
      paymentProviderId: order.paymentProviderId,
      paymentProviderStatus: order.paymentProviderStatus,
      investorWalletAddress: order.investorWalletAddress,
    });

    return response.data ? mapOrderRecord(response.data) : order;
  }

  async listAssets(): Promise<AssetRecord[]> {
    const records = await listAll<Schema["Asset"]["type"], { nextToken?: string }>((args) =>
      this.client.models.Asset.list(args)
    );
    return records.map(mapAssetRecord);
  }

  async listListings(): Promise<Listing[]> {
    const records = await listAll<Schema["Listing"]["type"], { nextToken?: string }>((args) =>
      this.client.models.Listing.list(args)
    );
    return records.map(mapListingRecord);
  }

  async listProductsByListingId(listingId: string): Promise<Product[]> {
    const records = await listAll<Schema["Product"]["type"], { nextToken?: string }>((args) =>
      this.client.models.Product.list({
        filter: { listingId: { eq: listingId } },
        ...(args ?? {}),
      })
    );
    return records.map(mapProductRecord);
  }

  async listOrdersByInvestor(investorId: string): Promise<Order[]> {
    const records = await listAll<Schema["Order"]["type"], { nextToken?: string }>((args) =>
      this.client.models.Order.list({
        filter: { investorId: { eq: investorId } },
        ...(args ?? {}),
      })
    );
    return records.map(mapOrderRecord);
  }

  async listOrdersByProvider(providerUserId: string): Promise<Order[]> {
    const records = await listAll<Schema["Order"]["type"], { nextToken?: string }>((args) =>
      this.client.models.Order.list({
        filter: { providerUserId: { eq: providerUserId } },
        ...(args ?? {}),
      })
    );
    return records.map(mapOrderRecord);
  }

  async listPublishedBlogPosts(): Promise<BlogPost[]> {
    const records = await listAll<Schema["BlogPost"]["type"], { nextToken?: string }>((args) =>
      this.client.models.BlogPost.list({
        filter: { status: { eq: "published" } },
        ...(args ?? {}),
      })
    );
    return records.map(mapBlogPostRecord);
  }

  async listBlogPosts(): Promise<BlogPost[]> {
    const records = await listAll<Schema["BlogPost"]["type"], { nextToken?: string }>((args) =>
      this.client.models.BlogPost.list({
        ...(args ?? {}),
      })
    );
    return records.map(mapBlogPostRecord);
  }

  async saveBlogPost(blogPost: BlogPost): Promise<BlogPost> {
    const existing = await this.client.models.BlogPost.get({ id: blogPost.id });
    const payload = {
      id: blogPost.id,
      title: blogPost.title,
      excerpt: blogPost.excerpt,
      coverImage: blogPost.coverImage ? normalizeStoredPublicPath(blogPost.coverImage) : "",
      contentHtml: blogPost.contentHtml,
      status: blogPost.status,
      publishedAt: blogPost.publishedAt || null,
      updatedAt: blogPost.updatedAt,
    };

    if (existing.data) {
      await this.client.models.BlogPost.update(payload);
    } else {
      await this.client.models.BlogPost.create(payload);
    }

    return blogPost;
  }

  async deleteBlogPost(blogId: string): Promise<void> {
    await this.client.models.BlogPost.delete({ id: blogId });
  }
}
