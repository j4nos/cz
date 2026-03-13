"use client";

import type { PricingController } from "@/src/application/pricingController";
import { createDefaultPricingState, type ProductPricingState } from "@/src/application/pricingState";
import { AmplifyInvestmentRepository } from "@/src/infrastructure/repositories/amplifyInvestmentRepository";

function nextProductId(listingId: string) {
  return `product-${listingId}-${Date.now()}`;
}

export class AmplifyPricingController implements PricingController {
  constructor(private readonly repository: AmplifyInvestmentRepository = new AmplifyInvestmentRepository()) {}

  async loadPricingState(
    listingId: string,
    productId?: string
  ): Promise<ProductPricingState> {
    console.log("[PRODUCT_PRICING_DEBUG] AmplifyPricingController.loadPricingState:start", {
      listingId,
      productId: productId ?? null,
    });
    const product = productId
      ? await this.repository.getProductById(productId)
      : (await this.repository.listProductsByListingId(listingId))[0];
    const state = createDefaultPricingState(product ?? undefined, listingId);
    console.log("[PRODUCT_PRICING_DEBUG] AmplifyPricingController.loadPricingState:result", {
      listingId,
      foundProduct: Boolean(product),
      productId: product?.id ?? null,
      stateProductId: state.productId ?? null,
      name: state.name,
    });
    return state;
  }

  async savePricingState(state: ProductPricingState): Promise<ProductPricingState> {
    console.log("[PRODUCT_PRICING_DEBUG] AmplifyPricingController.savePricingState:start", {
      listingId: state.listingId,
      productId: state.productId ?? null,
      name: state.name,
      currency: state.currency,
      unitPrice: state.unitPrice,
      minPurchase: state.minPurchase,
      maxPurchase: state.maxPurchase,
      supplyTotal: state.supplyTotal,
    });
    const existingProduct = state.productId ? await this.repository.getProductById(state.productId) : null;
    console.log("[PRODUCT_PRICING_DEBUG] AmplifyPricingController.savePricingState:existing", {
      requestedProductId: state.productId ?? null,
      exists: Boolean(existingProduct),
      existingListingId: existingProduct?.listingId ?? null,
    });

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
      console.log("[PRODUCT_PRICING_DEBUG] AmplifyPricingController.savePricingState:updateResult", {
        productId: updated.id,
        listingId: updated.listingId,
        name: updated.name,
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

    console.log("[PRODUCT_PRICING_DEBUG] AmplifyPricingController.savePricingState:createResult", {
      productId: created.id,
      listingId: created.listingId,
      name: created.name,
    });

    return { ...state, productId: created.id };
  }

  async deleteProduct(productId: string): Promise<void> {
    console.log("[PRODUCT_PRICING_DEBUG] AmplifyPricingController.deleteProduct:start", {
      productId,
    });
    await this.repository.deleteProduct(productId);
    console.log("[PRODUCT_PRICING_DEBUG] AmplifyPricingController.deleteProduct:result", {
      productId,
    });
  }
}
