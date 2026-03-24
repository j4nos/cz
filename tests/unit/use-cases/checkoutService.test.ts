import { describe, expect, it, vi } from "vitest";

import type { AuthClient } from "@/src/application/interfaces/authClient";
import type { OrderPort } from "@/src/application/interfaces/orderPort";
import type { ReadPort } from "@/src/application/interfaces/readPort";
import {
  getCheckoutPaymentOptions,
  getCheckoutSubmissionError,
} from "@/src/application/use-cases/checkoutRules";
import { CheckoutService } from "@/src/application/use-cases/checkoutService";
import { makeAsset, makeListing, makeOrder, makeProduct } from "@/tests/helpers/factories";

function makeReadPort(): ReadPort {
  return {
    listAssets: vi.fn(),
    getAssetById: vi.fn().mockResolvedValue(makeAsset()),
    getListingById: vi.fn().mockResolvedValue(makeListing()),
    getOrderById: vi.fn(),
    listListingsByAssetId: vi.fn(),
    listProductsByListingId: vi.fn().mockResolvedValue([makeProduct()]),
    getProductById: vi.fn(),
    listOrdersByInvestor: vi.fn(),
    listOrdersByProvider: vi.fn(),
  };
}

function makeOrderPort(): OrderPort {
  return {
    placeOrder: vi.fn().mockResolvedValue(makeOrder()),
    completeOrder: vi.fn(),
    markOrderWithdrawn: vi.fn(),
  };
}

function makeAuthClient(): AuthClient {
  return {
    onAuthStateChanged: vi.fn(),
    getAccessToken: vi.fn(),
    signInWithEmailAndPassword: vi.fn(),
    createUserWithEmailAndPassword: vi.fn(),
    confirmUserSignUp: vi.fn(),
    resendConfirmationCode: vi.fn(),
    requestPasswordReset: vi.fn(),
    confirmPasswordReset: vi.fn(),
    signOut: vi.fn(),
    getCurrentUser: vi.fn(),
    getUserProfile: vi.fn().mockResolvedValue(null),
    upsertUserProfile: vi.fn(),
  };
}

describe("checkoutRules", () => {
  it("only exposes bank transfer when beneficiary data is present", () => {
    expect(getCheckoutPaymentOptions(makeAsset({ beneficiaryIban: "", beneficiaryLabel: "" }))).toEqual([
      { value: "card", label: "Card" },
    ]);

    expect(getCheckoutPaymentOptions(makeAsset({ beneficiaryIban: "HU12", beneficiaryLabel: "Cityzeen" }))).toEqual([
      { value: "card", label: "Card" },
      { value: "bank-transfer", label: "Bank transfer (Powens)" },
    ]);
  });

  it("returns the expected validation errors for checkout submission", () => {
    expect(
      getCheckoutSubmissionError({
        listing: null,
        product: makeProduct(),
        activeUserId: "investor-1",
        authLoading: false,
        paymentType: "card",
        asset: makeAsset(),
      }),
    ).toEqual({ error: "Missing listing or product." });

    expect(
      getCheckoutSubmissionError({
        listing: makeListing(),
        product: makeProduct(),
        authLoading: false,
        paymentType: "card",
        asset: makeAsset(),
      }),
    ).toEqual({
      error: "Login required to place order.",
      shouldRedirectToLogin: true,
    });

    expect(
      getCheckoutSubmissionError({
        listing: makeListing(),
        product: makeProduct(),
        activeUserId: "investor-1",
        authLoading: false,
        paymentType: "bank-transfer",
        asset: makeAsset({ beneficiaryIban: "", beneficiaryLabel: "" }),
      }),
    ).toEqual({ error: "Bank transfer is not available for this asset." });

    expect(
      getCheckoutSubmissionError({
        listing: makeListing(),
        product: makeProduct(),
        activeUserId: "investor-1",
        authLoading: false,
        paymentType: "bank-transfer",
        asset: makeAsset({ beneficiaryIban: "HU12", beneficiaryLabel: "Cityzeen" }),
      }),
    ).toEqual({ error: "Missing access token for bank transfer." });
  });
});

describe("CheckoutService", () => {
  it("returns an error result with redirectToLogin when the user is unauthenticated", async () => {
    const service = new CheckoutService(makeReadPort(), makeOrderPort(), makeAuthClient(), vi.fn());

    const result = await service.submitCheckout({
      listing: makeListing(),
      asset: makeAsset(),
      product: makeProduct(),
      quantity: 2,
      paymentType: "card",
      authLoading: false,
    });

    expect(result).toEqual({
      kind: "error",
      message: "Login required to place order.",
      tone: "warning",
      redirectToLogin: true,
    });
  });

  it("returns a redirect result when bank transfer payment starts successfully", async () => {
    const orderPort = makeOrderPort();
    const createBankTransferPayment = vi.fn().mockResolvedValue({ redirectUrl: "https://powens.test/redirect" });
    const service = new CheckoutService(makeReadPort(), orderPort, makeAuthClient(), createBankTransferPayment);

    const result = await service.submitCheckout({
      listing: makeListing(),
      asset: makeAsset({ beneficiaryIban: "HU12", beneficiaryLabel: "Cityzeen" }),
      product: makeProduct(),
      quantity: 2,
      coupon: "SPRING24",
      notes: "Investor note",
      paymentType: "bank-transfer",
      activeUserId: "investor-1",
      authLoading: false,
      accessToken: "token",
    });

    expect(orderPort.placeOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        coupon: "SPRING24",
        notes: "Investor note",
      }),
    );
    expect(createBankTransferPayment).toHaveBeenCalledWith({ orderId: "order-1", accessToken: "token" });
    expect(result).toEqual({ kind: "redirect", url: "https://powens.test/redirect" });
  });

  it("returns a user-facing error when bank transfer start does not return a redirect url", async () => {
    const service = new CheckoutService(
      makeReadPort(),
      makeOrderPort(),
      makeAuthClient(),
      vi.fn().mockResolvedValue({ error: "Powens unavailable" }),
    );

    const result = await service.submitCheckout({
      listing: makeListing(),
      asset: makeAsset({ beneficiaryIban: "HU12", beneficiaryLabel: "Cityzeen" }),
      product: makeProduct(),
      quantity: 2,
      paymentType: "bank-transfer",
      activeUserId: "investor-1",
      authLoading: false,
      accessToken: "token",
    });

    expect(result).toEqual({ kind: "error", message: "Powens unavailable", tone: "danger" });
  });

  it("returns success for card payments without starting bank transfer", async () => {
    const createBankTransferPayment = vi.fn();
    const service = new CheckoutService(makeReadPort(), makeOrderPort(), makeAuthClient(), createBankTransferPayment);

    const result = await service.submitCheckout({
      listing: makeListing(),
      asset: makeAsset(),
      product: makeProduct(),
      quantity: 2,
      paymentType: "card",
      activeUserId: "investor-1",
      authLoading: false,
    });

    expect(result).toEqual({ kind: "success", orderId: "order-1" });
    expect(createBankTransferPayment).not.toHaveBeenCalled();
  });

  it("passes coupon and notes into order placement", async () => {
    const orderPort = makeOrderPort();
    const service = new CheckoutService(makeReadPort(), orderPort, makeAuthClient(), vi.fn());

    await service.submitCheckout({
      listing: makeListing(),
      asset: makeAsset(),
      product: makeProduct(),
      quantity: 2,
      coupon: "VIP50",
      notes: "Save this on the order",
      paymentType: "card",
      activeUserId: "investor-1",
      authLoading: false,
    });

    expect(orderPort.placeOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        coupon: "VIP50",
        notes: "Save this on the order",
      }),
    );
  });
});
