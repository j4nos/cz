import type { Asset, Listing, Product } from "@/src/domain/entities";

export type CheckoutPaymentType = "card" | "bank-transfer";

export type CheckoutPaymentOption = {
  value: CheckoutPaymentType;
  label: string;
};

export function isBankTransferAvailable(asset: Pick<Asset, "beneficiaryIban" | "beneficiaryLabel"> | null) {
  return Boolean(asset?.beneficiaryIban?.trim() && asset?.beneficiaryLabel?.trim());
}

export function getCheckoutPaymentOptions(
  asset: Pick<Asset, "beneficiaryIban" | "beneficiaryLabel"> | null,
): CheckoutPaymentOption[] {
  return [
    { value: "card", label: "Card" },
    ...(isBankTransferAvailable(asset)
      ? [{ value: "bank-transfer" as const, label: "Bank transfer (Powens)" }]
      : []),
  ];
}

export function getDefaultCheckoutPaymentType(
  asset: Pick<Asset, "beneficiaryIban" | "beneficiaryLabel"> | null,
  requestedPaymentType?: string,
): CheckoutPaymentType {
  if (requestedPaymentType === "bank-transfer" && isBankTransferAvailable(asset)) {
    return "bank-transfer";
  }

  return "card";
}

export function getSelectedCheckoutProduct(
  products: Product[],
  requestedProductId?: string,
): Product | null {
  if (!products.length) {
    return null;
  }

  if (!requestedProductId) {
    return products[0] ?? null;
  }

  return products.find((item) => item.id === requestedProductId) ?? products[0] ?? null;
}

export function getDefaultCheckoutQuantity(
  product: Pick<Product, "minPurchase"> | null,
  requestedQuantity?: number,
): string {
  if (typeof requestedQuantity === "number" && Number.isFinite(requestedQuantity) && requestedQuantity > 0) {
    return String(requestedQuantity);
  }

  return String(product?.minPurchase ?? 1);
}

export function getCheckoutSubmissionError(input: {
  listing: Listing | null;
  product: Product | null;
  activeUserId?: string;
  authLoading: boolean;
  paymentType: CheckoutPaymentType;
  asset: Pick<Asset, "beneficiaryIban" | "beneficiaryLabel"> | null;
  accessToken?: string | null;
}): { error?: string; shouldRedirectToLogin?: boolean } {
  const { listing, product, activeUserId, authLoading, paymentType, asset, accessToken } = input;

  if (!listing || !product) {
    return { error: "Missing listing or product." };
  }

  if (!activeUserId && !authLoading) {
    return {
      error: "Login required to place order.",
      shouldRedirectToLogin: true,
    };
  }

  if (!activeUserId) {
    return { error: "Login required to place order." };
  }

  if (paymentType === "bank-transfer" && !isBankTransferAvailable(asset)) {
    return { error: "Bank transfer is not available for this asset." };
  }

  if (paymentType === "bank-transfer" && !accessToken) {
    return { error: "Missing access token for bank transfer." };
  }

  return {};
}
