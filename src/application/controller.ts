"use client";

import { InvestmentPlatformService, type Clock, type IdGenerator } from "@/src/application/useCases";
import type { Listing, Product } from "@/src/domain/entities";
import { BrowserInvestmentRepository } from "@/src/infrastructure/browserInvestmentRepository";
import type {
  AssetRecord,
  ListingWithAssetView,
  PricingTier,
  ProductPricingState,
} from "@/src/infrastructure/browserDemoStore";

class BrowserIdGenerator implements IdGenerator {
  next(): string {
    return `id-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
}

class BrowserClock implements Clock {
  now(): string {
    return new Date().toISOString();
  }
}

export type { AssetRecord, ListingWithAssetView, PricingTier, ProductPricingState };

export interface Controller {
  repository: BrowserInvestmentRepository;
  service: InvestmentPlatformService;
  queries: {
    listAssets: () => AssetRecord[];
    getAssetById: (assetId: string) => AssetRecord | null;
    listListings: () => Listing[];
    listOpenListings: () => ListingWithAssetView[];
    getListingById: (listingId: string) => Listing | null;
    getListingWithAssetById: (listingId: string) => ListingWithAssetView | null;
    listListingsByAssetId: (assetId: string) => Listing[];
    getProductsByListingId: (listingId: string) => Product[];
    getProductById: (productId: string) => Product | null;
    getOrdersForInvestor: (investorId: string) => ReturnType<BrowserInvestmentRepository["listOrdersByInvestor"]>;
    getOrdersForProvider: (providerUserId: string) => ReturnType<BrowserInvestmentRepository["listOrdersByProvider"]>;
    getPublishedBlogPosts: () => ReturnType<BrowserInvestmentRepository["listPublishedBlogPosts"]>;
    getPublishedBlogPostById: (blogId: string) => ReturnType<BrowserInvestmentRepository["getPublishedBlogPostById"]>;
    getPricingState: (listingId: string) => ProductPricingState;
  };
  commands: {
    createAssetWithMedia: (input: {
      tenantUserId: string;
      name: string;
      country: string;
      assetClass: string;
      tokenStandard?: string;
      imageUrls: string[];
      documents: { name: string }[];
    }) => Promise<AssetRecord | null>;
    saveListingDraft: (input: Listing) => void;
    createListingDraft: (input: {
      assetId: string;
      title: string;
      eligibility: string;
      currency: string;
      fromPrice: number;
      description: string;
      startsAt?: string;
      endsAt?: string;
    }) => Promise<Listing>;
    deleteListing: (listingId: string) => void;
    removeProduct: (productId: string) => void;
    saveProductPricing: (pricingState: ProductPricingState) => Promise<ProductPricingState>;
    placeOrder: (input: {
      investorId: string;
      listingId: string;
      productId: string;
      quantity: number;
      investorWalletAddress?: string;
    }) => Promise<Awaited<ReturnType<InvestmentPlatformService["startOrder"]>>>;
    completeOrder: (orderId: string) => Promise<Awaited<ReturnType<InvestmentPlatformService["completeOrderPayment"]>>>;
  };
}

function buildController(): Controller {
  const repository = new BrowserInvestmentRepository();
  const service = new InvestmentPlatformService(repository, new BrowserIdGenerator(), new BrowserClock());

  const queries: Controller["queries"] = {
    listAssets: () => repository.listAssets(),
    getAssetById: (assetId) => repository.getAssetRecordById(assetId),
    listListings: () => repository.listListings(),
    listOpenListings: () => repository.listListingsWithAsset().filter((entry) => entry.listing.saleStatus === "OPEN"),
    getListingById: (listingId) => repository.getListingByIdForView(listingId),
    getListingWithAssetById: (listingId) => repository.getListingWithAssetById(listingId),
    listListingsByAssetId: (assetId) => repository.listListingsByAssetId(assetId),
    getProductsByListingId: (listingId) => repository.listProductsByListingId(listingId),
    getProductById: (productId) => {
      for (const listing of repository.listListings()) {
        const product = repository.listProductsByListingId(listing.id).find((current) => current.id === productId);
        if (product) {
          return product;
        }
      }

      return null;
    },
    getOrdersForInvestor: (investorId) => repository.listOrdersByInvestor(investorId),
    getOrdersForProvider: (providerUserId) => repository.listOrdersByProvider(providerUserId),
    getPublishedBlogPosts: () => repository.listPublishedBlogPosts(),
    getPublishedBlogPostById: (blogId) => repository.getPublishedBlogPostById(blogId),
    getPricingState: (listingId) => repository.getPricingState(listingId),
  };

  const commands: Controller["commands"] = {
    createAssetWithMedia: async (input) => {
      const asset = await service.createAsset(input);
      const stored = repository.getAssetRecordById(asset.id);

      repository.saveAssetRecord({
        ...(stored ?? { ...asset, documents: [] }),
        ...asset,
        imageUrls: input.imageUrls,
        documents: input.documents.map((document, index) => ({
          id: `${asset.id}-doc-${index + 1}`,
          assetId: asset.id,
          name: document.name,
        })),
        tokenAddress: `0x${asset.id.slice(-8)}`,
        latestRunId: `run-${Date.now()}`,
      });

      return repository.getAssetRecordById(asset.id);
    },
    saveListingDraft: (input) => {
      repository.saveListing(input);
    },
    createListingDraft: async (input) => {
      const listing = await service.createListing(input);
      const listingDraft: Listing = {
        ...listing,
        saleStatus: "CLOSED",
      };

      repository.saveListing(listingDraft);
      return listingDraft;
    },
    deleteListing: (listingId) => {
      repository.deleteListing(listingId);
    },
    removeProduct: (productId) => {
      repository.deleteProduct(productId);
    },
    saveProductPricing: async (pricingState) => {
      const existingProduct = pricingState.productId ? await repository.getProductById(pricingState.productId) : null;

      let product: Product;

      if (existingProduct) {
        product = {
          ...existingProduct,
          name: pricingState.name,
          currency: pricingState.currency,
          unitPrice: pricingState.unitPrice,
          minPurchase: pricingState.minPurchase,
          maxPurchase: pricingState.maxPurchase,
          eligibleInvestorType: pricingState.eligibleInvestorType,
          supplyTotal: pricingState.supplyTotal,
          remainingSupply: Math.min(existingProduct.remainingSupply, pricingState.supplyTotal),
        };
        await repository.updateProduct(product);
      } else {
        product = await service.createProduct({
          listingId: pricingState.listingId,
          name: pricingState.name,
          currency: pricingState.currency,
          unitPrice: pricingState.unitPrice,
          minPurchase: pricingState.minPurchase,
          maxPurchase: pricingState.maxPurchase,
          eligibleInvestorType: pricingState.eligibleInvestorType,
          supplyTotal: pricingState.supplyTotal,
        });
      }

      repository.savePricingState({
        ...pricingState,
        productId: product.id,
      });

      return repository.getPricingState(pricingState.listingId);
    },
    placeOrder: (input) => service.startOrder(input),
    completeOrder: (orderId) => service.completeOrderPayment({ orderId }),
  };

  return { repository, service, queries, commands };
}

let controllerSingleton: Controller | null = null;

export function getController(): Controller {
  if (!controllerSingleton) {
    controllerSingleton = buildController();
  }

  return controllerSingleton;
}
