import type { ProductPricingState } from "@/src/application/dto/pricingState";

export interface PricingPort {
  loadPricingState: (
    listingId: string,
    productId?: string
  ) => Promise<ProductPricingState>;
  savePricingState: (state: ProductPricingState) => Promise<ProductPricingState>;
  deleteProduct: (productId: string) => Promise<void>;
}
