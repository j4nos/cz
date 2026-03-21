import type { Schema } from "@/amplify/data/resource";
import type { Listing, Product } from "@/src/domain/entities";
import { listAll } from "@/src/infrastructure/amplify/pagination";
import { mapListingRecord, mapProductRecord } from "@/src/infrastructure/amplify/schemaMappers";
import type {
  AmplifyDataClient,
  AmplifyReadAuthMode,
} from "@/src/infrastructure/repositories/amplifyClient";

export class AmplifyCatalogRepository {
  constructor(
    private readonly client: AmplifyDataClient,
    private readonly readAuthMode?: AmplifyReadAuthMode,
  ) {}

  private withReadAuth(input?: Record<string, unknown>) {
    return {
      ...(input ?? {}),
      ...(this.readAuthMode ? { authMode: this.readAuthMode } : {}),
    };
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
    const response = await this.client.models.Listing.get(
      { id },
      this.withReadAuth(),
    );
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

  async listListings(): Promise<Listing[]> {
    const records = await listAll<Schema["Listing"]["type"]>((nextToken) =>
      this.client.models.Listing.list(
        this.withReadAuth(nextToken ? { nextToken } : undefined),
      ),
    );
    return records.map(mapListingRecord);
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
    const response = await this.client.models.Product.get(
      { id },
      this.withReadAuth(),
    );
    return response.data ? mapProductRecord(response.data) : null;
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

  async deleteProduct(productId: string): Promise<void> {
    await this.client.models.Product.delete({ id: productId });
  }

  async listProductsByListingId(listingId: string): Promise<Product[]> {
    const records = await listAll<Schema["Product"]["type"]>((nextToken) =>
      this.client.models.Product.list({
        filter: { listingId: { eq: listingId } },
        ...(this.readAuthMode ? { authMode: this.readAuthMode } : {}),
        ...(nextToken ? { nextToken } : {}),
      }),
    );
    return records.map(mapProductRecord);
  }
}
