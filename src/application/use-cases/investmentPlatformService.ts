import type { InvestmentRepository } from "@/src/domain/repositories/investmentRepository";
import type { Asset, Listing, Order, Product, UserProfile } from "@/src/domain/entities";
import { DomainError } from "@/src/domain/value-objects/errors";

export interface IdGenerator {
  next(): string;
}

export interface Clock {
  now(): string;
}

export class InvestmentPlatformService {
  constructor(
    private readonly repository: InvestmentRepository,
    private readonly idGenerator: IdGenerator,
    private readonly clock: Clock,
  ) {}

  async registerUserProfile(input: {
    email: string;
    role: UserProfile["role"];
    country: string;
    investorType?: string;
    companyName?: string;
  }): Promise<UserProfile> {
    const timestamp = this.clock.now();

    return this.repository.createUserProfile({
      id: this.idGenerator.next(),
      email: input.email,
      role: input.role,
      country: input.country,
      investorType: input.investorType,
      companyName: input.companyName,
      kycStatus: "approved",
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  }

  async createAsset(input: {
    tenantUserId: string;
    name: string;
    country: string;
    assetClass: string;
    tokenStandard?: string;
  }): Promise<Asset> {
    await this.requireUser(input.tenantUserId);

    return this.repository.createAsset({
      id: this.idGenerator.next(),
      tenantUserId: input.tenantUserId,
      name: input.name,
      country: input.country,
      assetClass: input.assetClass,
      tokenStandard: input.tokenStandard,
      status: "draft",
      missingDocsCount: 0,
      imageUrls: [],
    });
  }

  async createListing(input: {
    assetId: string;
    title: string;
    description: string;
    eligibility: string;
    currency: string;
    fromPrice: number;
    startsAt?: string;
    endsAt?: string;
  }): Promise<Listing> {
    const asset = await this.requireAsset(input.assetId);
    await this.requireUser(asset.tenantUserId);

    return this.repository.createListing({
      id: this.idGenerator.next(),
      assetId: input.assetId,
      title: input.title,
      description: input.description,
      assetClass: asset.assetClass,
      eligibility: input.eligibility,
      currency: input.currency,
      fromPrice: input.fromPrice,
      saleStatus: "open",
      startsAt: input.startsAt,
      endsAt: input.endsAt,
    });
  }

  async createProduct(input: {
    listingId: string;
    name: string;
    currency: string;
    unitPrice: number;
    minPurchase: number;
    maxPurchase: number;
    eligibleInvestorType: string;
    supplyTotal: number;
  }): Promise<Product> {
    const listing = await this.requireListing(input.listingId);

    if (input.minPurchase <= 0 || input.maxPurchase < input.minPurchase) {
      throw new DomainError("Purchase limits are invalid.");
    }

    if (input.supplyTotal < input.maxPurchase) {
      throw new DomainError("Supply total must cover max purchase.");
    }

    return this.repository.createProduct({
      id: this.idGenerator.next(),
      listingId: listing.id,
      name: input.name,
      currency: input.currency,
      unitPrice: input.unitPrice,
      minPurchase: input.minPurchase,
      maxPurchase: input.maxPurchase,
      eligibleInvestorType: input.eligibleInvestorType,
      supplyTotal: input.supplyTotal,
      remainingSupply: input.supplyTotal,
    });
  }

  async startOrder(input: {
    investorId: string;
    listingId: string;
    productId: string;
    quantity: number;
    paymentProvider?: string;
    investorWalletAddress?: string;
  }): Promise<Order> {
    const investor = await this.requireUser(input.investorId);

    const listing = await this.requireListing(input.listingId);
    if (listing.saleStatus !== "open") {
      throw new DomainError("Listing is not open for orders.");
    }

    const product = await this.requireProduct(input.productId);
    if (product.listingId !== listing.id) {
      throw new DomainError("Product does not belong to the selected listing.");
    }

    if (input.quantity < product.minPurchase || input.quantity > product.maxPurchase) {
      throw new DomainError("Quantity is outside the allowed purchase range.");
    }

    if (input.quantity > product.remainingSupply) {
      throw new DomainError("Not enough remaining supply.");
    }

    if (
      investor.investorType &&
      product.eligibleInvestorType !== "ANY" &&
      investor.investorType !== product.eligibleInvestorType
    ) {
      throw new DomainError("Investor is not eligible for this product.");
    }

    const asset = await this.requireAsset(listing.assetId);

    return this.repository.createOrder({
      id: this.idGenerator.next(),
      investorId: investor.id,
      providerUserId: asset.tenantUserId,
      listingId: listing.id,
      productId: product.id,
      quantity: input.quantity,
      unitPrice: product.unitPrice,
      total: product.unitPrice * input.quantity,
      status: "pending",
      currency: product.currency,
      paymentProvider: input.paymentProvider,
      investorWalletAddress: input.investorWalletAddress,
    });
  }

  async completeOrderPayment(input: { orderId: string }): Promise<Order> {
    const order = await this.requireOrder(input.orderId);
    if (order.status !== "pending") {
      throw new DomainError("Only pending payment orders can be completed.");
    }

    const product = await this.requireProduct(order.productId);
    if (order.quantity > product.remainingSupply) {
      throw new DomainError("Not enough remaining supply to complete the order.");
    }

    product.remainingSupply -= order.quantity;
    await this.repository.updateProduct(product);

    order.status = "paid";
    return this.repository.updateOrder(order);
  }

  private async requireUser(id: string): Promise<UserProfile> {
    const user = await this.repository.getUserProfileById(id);
    if (!user) {
      throw new DomainError(`UserProfile ${id} was not found.`);
    }

    return user;
  }

  private async requireAsset(id: string): Promise<Asset> {
    const asset = await this.repository.getAssetById(id);
    if (!asset) {
      throw new DomainError(`Asset ${id} was not found.`);
    }

    return asset;
  }

  private async requireListing(id: string): Promise<Listing> {
    const listing = await this.repository.getListingById(id);
    if (!listing) {
      throw new DomainError(`Listing ${id} was not found.`);
    }

    return listing;
  }

  private async requireProduct(id: string): Promise<Product> {
    const product = await this.repository.getProductById(id);
    if (!product) {
      throw new DomainError(`Product ${id} was not found.`);
    }

    return product;
  }

  private async requireOrder(id: string): Promise<Order> {
    const order = await this.repository.getOrderById(id);
    if (!order) {
      throw new DomainError(`Order ${id} was not found.`);
    }

    return order;
  }
}
