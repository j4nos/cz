"use client";

import type { PricingPort } from "@/src/application/interfaces/pricingPort";
import { createDefaultPricingState, type ProductPricingState } from "@/src/application/dto/pricingState";
import { AmplifyInvestmentRepository } from "@/src/infrastructure/repositories/amplifyInvestmentRepository";

function nextProductId(listingId: string) {
  return `product-${listingId}-${Date.now()}`;
}

export class AmplifyPricingController implements PricingPort {
  constructor(private readonly repository: AmplifyInvestmentRepository = new AmplifyInvestmentRepository()) {}

  async loadPricingState(
    listingId: string,
    productId?: string
  ): Promise<ProductPricingState> {
    const product = productId
      ? await this.repository.getProductById(productId)
      : (await this.repository.listProductsByListingId(listingId))[0];
    return createDefaultPricingState(product ?? undefined, listingId);
  }

  async savePricingState(state: ProductPricingState): Promise<ProductPricingState> {
    const existingProduct = state.productId ? await this.repository.getProductById(state.productId) : null;

    if (existingProduct) {
      const updated = await this.repository.updateProduct({
        ...existingProduct,
        name: state.name,
        currency: state.currency,
        unitPrice: state.unitPrice,
        minPurchase: state.minPurchase,
        maxPurchase: state.maxPurchase,
        eligibleInvestorType: state.eligibleInvestorType,
        supplyTotal: state.supplyTotal,
        remainingSupply: Math.min(existingProduct.remainingSupply, state.supplyTotal),
      });
      return { ...state, productId: existingProduct.id };
    }

    const created = await this.repository.createProduct({
      id: state.productId || nextProductId(state.listingId),
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

    return { ...state, productId: created.id };
  }

  async deleteProduct(productId: string): Promise<void> {
    await this.repository.deleteProduct(productId);
  }
}
