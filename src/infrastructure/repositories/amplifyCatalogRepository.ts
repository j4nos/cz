import type { Schema } from "@/amplify/data/resource";
import type { Listing, Product } from "@/src/domain/entities";
import { listAll } from "@/src/infrastructure/amplify/pagination";
import {
  mapListingRecord,
  mapProductCouponRecord,
  mapProductRecord,
} from "@/src/infrastructure/amplify/schemaMappers";
import type {
  AmplifyDataClient,
  AmplifyReadAuthMode,
} from "@/src/infrastructure/repositories/amplifyClient";

export class AmplifyCatalogRepository {
  constructor(
    private readonly client: AmplifyDataClient,
    private readonly readAuthMode?: AmplifyReadAuthMode,
    private readonly authToken?: string,
  ) {}

  private withReadAuth(input?: Record<string, unknown>) {
    return {
      ...(input ?? {}),
      ...(this.readAuthMode ? { authMode: this.readAuthMode } : {}),
      ...(this.authToken ? { authToken: this.authToken } : {}),
    };
  }

  private withWriteAuth(input?: Record<string, unknown>) {
    return {
      ...(input ?? {}),
      ...(this.authToken ? ({ authMode: "lambda" as const, authToken: this.authToken }) : {}),
    };
  }

  private get productCouponModel() {
    return (this.client.models as typeof this.client.models & {
      ProductCoupon?: {
        list: AmplifyDataClient["models"]["Product"]["list"];
        create: AmplifyDataClient["models"]["Product"]["create"];
        delete: AmplifyDataClient["models"]["Product"]["delete"];
      };
    }).ProductCoupon;
  }

  private assertCouponModelAvailableForWrite(product: Product) {
    if (this.productCouponModel || product.coupons.length === 0) {
      return;
    }

    throw new Error("Coupon storage is not deployed yet. Deploy the latest Amplify schema before saving coupons.");
  }

  private async listCouponsByProductId(productId: string) {
    const productCouponModel = this.productCouponModel;
    if (!productCouponModel) {
      return [];
    }

    const records = await listAll<Schema["ProductCoupon"]["type"]>((nextToken) =>
      productCouponModel.list(
        this.withReadAuth({
          filter: { productId: { eq: productId } },
          ...(nextToken ? { nextToken } : {}),
        }),
      ),
    );

    return records.map(mapProductCouponRecord);
  }

  private async replaceCoupons(product: Product) {
    const productCouponModel = this.productCouponModel;
    this.assertCouponModelAvailableForWrite(product);
    if (!productCouponModel) {
      return;
    }

    const existing = await listAll<Schema["ProductCoupon"]["type"]>((nextToken) =>
      productCouponModel.list(
        this.withReadAuth({
          filter: { productId: { eq: product.id } },
          ...(nextToken ? { nextToken } : {}),
        }),
      ),
    );

    await Promise.all(
      existing.map((coupon) => productCouponModel.delete({ id: coupon.id }, this.withWriteAuth())),
    );

    await Promise.all(
      product.coupons.map((coupon) =>
        productCouponModel.create({
          id: `${product.id}:${coupon.code}`,
          productId: product.id,
          code: coupon.code,
          discountedUnitPrice: coupon.discountedUnitPrice,
        }, this.withWriteAuth()),
      ),
    );
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
    }, this.withWriteAuth());

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
    }, this.withWriteAuth());

    return response.data ? mapListingRecord(response.data) : listing;
  }

  async deleteListing(listingId: string): Promise<void> {
    await this.client.models.Listing.delete({ id: listingId }, this.withWriteAuth());
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
    }, this.withWriteAuth());
    const product = response.data ? mapProductRecord(response.data, input.coupons) : input;
    await this.replaceCoupons(product);
    return product;
  }

  async getProductById(id: string): Promise<Product | null> {
    const response = await this.client.models.Product.get(
      { id },
      this.withReadAuth(),
    );
    if (!response.data) {
      return null;
    }

    const coupons = await this.listCouponsByProductId(response.data.id);
    return mapProductRecord(response.data, coupons);
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
    }, this.withWriteAuth());
    const saved = response.data ? mapProductRecord(response.data, product.coupons) : product;
    await this.replaceCoupons(saved);
    return saved;
  }

  async deleteProduct(productId: string): Promise<void> {
    const productCouponModel = this.productCouponModel;
    if (productCouponModel) {
      const existingCoupons = await listAll<Schema["ProductCoupon"]["type"]>((nextToken) =>
        productCouponModel.list(
          this.withReadAuth({
            filter: { productId: { eq: productId } },
            ...(nextToken ? { nextToken } : {}),
          }),
        ),
      );
      await Promise.all(
        existingCoupons.map((coupon) => productCouponModel.delete({ id: coupon.id }, this.withWriteAuth())),
      );
    }
    await this.client.models.Product.delete({ id: productId }, this.withWriteAuth());
  }

  async listProductsByListingId(listingId: string): Promise<Product[]> {
    const records = await listAll<Schema["Product"]["type"]>((nextToken) =>
      this.client.models.Product.list(
        this.withReadAuth({
          filter: { listingId: { eq: listingId } },
          ...(nextToken ? { nextToken } : {}),
        }),
      ),
    );
    return Promise.all(
      records.map(async (record) => {
        const coupons = await this.listCouponsByProductId(record.id);
        return mapProductRecord(record, coupons);
      }),
    );
  }
}
