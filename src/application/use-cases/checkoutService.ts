import {
  getCheckoutPaymentOptions,
  getCheckoutSubmissionError,
  getDefaultCheckoutPaymentType,
  getDefaultCheckoutQuantity,
  getSelectedCheckoutProduct,
  type CheckoutPaymentOption,
  type CheckoutPaymentType,
} from "@/src/application/use-cases/checkoutRules";
import type { AuthClient } from "@/src/application/interfaces/authClient";
import type { Asset, Listing, Product } from "@/src/domain/entities";
import type { InvestmentPlatformService } from "@/src/application/use-cases/investmentPlatformService";
import { stripProductCoupons } from "@/src/domain/policies/productCouponPolicy";

type CheckoutReadRepository = {
  getAssetById: (assetId: string) => Promise<Asset | null>;
  getListingById: (listingId: string) => Promise<Listing | null>;
  listProductsByListingId: (listingId: string) => Promise<Product[]>;
};

type LoadCheckoutInput = {
  listingId: string;
  requestedProductId?: string;
  initialQuantity?: number;
};

type SubmitCheckoutInput = {
  listing: Listing | null;
  asset: Asset | null;
  product: Product | null;
  quantity: number;
  coupon?: string;
  notes?: string;
  paymentType: CheckoutPaymentType;
  activeUserId?: string;
  authLoading: boolean;
  accessToken?: string | null;
};

type CreatePaymentResult = {
  redirectUrl?: string;
  error?: string;
};

export class CheckoutService {
  constructor(
    private readonly repository: CheckoutReadRepository,
    private readonly orderService: Pick<InvestmentPlatformService, "startOrder">,
    private readonly authClient: AuthClient,
    private readonly createBankTransferPayment: (input: {
      orderId: string;
      accessToken: string;
    }) => Promise<CreatePaymentResult>,
  ) {}

  async loadCheckout(input: LoadCheckoutInput): Promise<{
    listing: Listing | null;
    asset: Asset | null;
    products: Product[];
    providerName: string | null;
    selectedProductId: string;
    quantity: string;
    paymentType: CheckoutPaymentType;
    paymentOptions: CheckoutPaymentOption[];
  }> {
    const listing = await this.repository.getListingById(input.listingId);
    const asset = listing?.assetId
      ? await this.repository.getAssetById(listing.assetId)
      : null;
    const products = (await this.repository.listProductsByListingId(input.listingId)).map(stripProductCoupons);
    const selectedProduct = getSelectedCheckoutProduct(products, input.requestedProductId);
    const providerProfile = asset?.tenantUserId
      ? await this.authClient.getUserProfile(asset.tenantUserId).catch(() => null)
      : null;
    const providerName = providerProfile?.companyName?.trim() || null;

    return {
      listing,
      asset,
      products,
      providerName,
      selectedProductId: selectedProduct?.id ?? "",
      quantity: getDefaultCheckoutQuantity(selectedProduct, input.initialQuantity),
      paymentType: getDefaultCheckoutPaymentType(asset, undefined),
      paymentOptions: getCheckoutPaymentOptions(asset),
    };
  }

  async submitCheckout(input: SubmitCheckoutInput): Promise<
    | { kind: "error"; message: string; tone: "warning" | "danger"; redirectToLogin?: boolean }
    | { kind: "redirect"; url: string }
    | { kind: "success"; orderId: string }
  > {
    const submission = getCheckoutSubmissionError({
      listing: input.listing,
      product: input.product,
      activeUserId: input.activeUserId,
      authLoading: input.authLoading,
      paymentType: input.paymentType,
      asset: input.asset,
      accessToken: input.accessToken,
    });

    if (submission.error) {
      return {
        kind: "error",
        message: submission.error,
        tone: submission.shouldRedirectToLogin ? "warning" : "danger",
        redirectToLogin: submission.shouldRedirectToLogin,
      };
    }

    if (!input.listing || !input.product || !input.activeUserId) {
      return { kind: "error", message: "Unable to place order.", tone: "danger" };
    }

    const order = await this.orderService.startOrder({
      investorId: input.activeUserId,
      listingId: input.listing.id,
      productId: input.product.id,
      quantity: input.quantity,
      coupon: input.coupon,
      notes: input.notes,
      paymentProvider: input.paymentType,
    });

    if (input.paymentType === "bank-transfer") {
      const payment = await this.createBankTransferPayment({
        orderId: order.id,
        accessToken: input.accessToken!,
      });
      if (!payment.redirectUrl) {
        return {
          kind: "error",
          message: payment.error || "Failed to start bank transfer.",
          tone: "danger",
        };
      }
      return { kind: "redirect", url: payment.redirectUrl };
    }

    return { kind: "success", orderId: order.id };
  }
}
