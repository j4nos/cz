import type { ProductPricingState } from "@/src/application/pricingState";

export interface PricingController {
  loadPricingState: (
    listingId: string,
    productId?: string
  ) => Promise<ProductPricingState>;
  savePricingState: (state: ProductPricingState) => Promise<ProductPricingState>;
  deleteProduct: (productId: string) => Promise<void>;
}
