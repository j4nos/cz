"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/Button";
import {
  Form,
  FormField,
  FormInput,
  FormSelect,
  FormTextarea,
} from "@/components/ui/Form";
import { KeyValueList } from "@/components/ui/KeyValueList";
import { useAuth } from "@/contexts/AuthContext";
import { useLoading } from "@/contexts/LoadingContext";
import { useToast } from "@/contexts/ToastContext";
import {
  getCheckoutPaymentOptions,
  getDefaultCheckoutPaymentType,
  isBankTransferAvailable,
  type CheckoutPaymentType,
} from "@/src/application/use-cases/checkoutRules";
import { CheckoutService } from "@/src/application/use-cases/checkoutService";
import { createAuthClient } from "@/src/infrastructure/auth/createAuthClient";
import { createOrderController } from "@/src/infrastructure/controllers/createOrderController";
import { createReadController } from "@/src/infrastructure/controllers/createReadController";
import type { Asset, Listing, Product } from "@/src/domain/entities";

type Props = {
  listingId: string;
  productId?: string;
  initialQuantity?: number;
  initialCoupon?: string;
  mode: "visitor" | "investor";
  onSuccess?: (orderId: string) => void;
};

export function Invest({
  listingId,
  productId,
  initialQuantity,
  initialCoupon,
  mode,
  onSuccess,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { activeUser, loading: authLoading, accessToken } = useAuth();
  const { setToast } = useToast();
  const { setLoading } = useLoading();
  const readController = useMemo(() => createReadController(), []);
  const authClient = useMemo(() => createAuthClient(), []);
  const checkoutService = useMemo(
    () =>
      new CheckoutService(
        readController,
        createOrderController(),
        authClient,
        async ({ orderId, accessToken: currentAccessToken }) => {
          const response = await fetch("/api/powens/create-payment", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${currentAccessToken}`,
            },
            body: JSON.stringify({ orderId }),
          });
          const payload = (await response.json()) as {
            redirectUrl?: string;
            error?: string;
          };
          return payload;
        },
      ),
    [authClient, readController],
  );

  const [listing, setListing] = useState<Listing | null>(null);
  const [asset, setAsset] = useState<Asset | null>(null);
  const [providerName, setProviderName] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const productIdParam = searchParams.get("productId") ?? "";
  const [selectedProductId, setSelectedProductId] = useState(
    productIdParam || productId || ""
  );
  const [quantity, setQuantity] = useState(String(initialQuantity ?? 1));
  const [paymentType, setPaymentType] = useState<CheckoutPaymentType>("card");
  const [coupon, setCoupon] = useState(initialCoupon ?? "");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (productIdParam && productIdParam !== selectedProductId) {
      setSelectedProductId(productIdParam);
      return;
    }
    if (!productIdParam && productId && productId !== selectedProductId) {
      setSelectedProductId(productId);
    }
  }, [productIdParam, productId, selectedProductId]);

  useEffect(() => {
    if (!pathname || selectedProductId === productIdParam) {
      return;
    }
    const params = new URLSearchParams(searchParams.toString());
    if (selectedProductId) {
      params.set("productId", selectedProductId);
    } else {
      params.delete("productId");
    }
    const nextQuery = params.toString();
    const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;
    router.replace(nextUrl);
  }, [pathname, productIdParam, router, searchParams, selectedProductId]);

  useEffect(() => {
    async function loadListing() {
      setLoading("invest-listing", true);
      setLoadError(null);
      try {
        const loaded = await checkoutService.loadCheckout({
          listingId,
          requestedProductId: productIdParam || productId || undefined,
          initialQuantity,
        });

        setListing(loaded.listing);
        setAsset(loaded.asset);
        setProducts(loaded.products);
        setProviderName(loaded.providerName);
        setSelectedProductId((current) => current || loaded.selectedProductId);
        setQuantity(loaded.quantity);
        setPaymentType((current) =>
          getDefaultCheckoutPaymentType(loaded.asset, current || loaded.paymentType),
        );
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to load listing.";
        setLoadError(message);
      } finally {
        setLoading("invest-listing", false);
      }
    }

    void loadListing();
  }, [
    initialQuantity,
    listingId,
    productId,
    productIdParam,
    checkoutService,
    setLoading,
  ]);

  const selectedProduct = useMemo(
    () => products.find((item) => item.id === selectedProductId) ?? null,
    [products, selectedProductId]
  );

  const hasSingleProduct = products.length === 1;
  const parsedQty = Number(quantity || 0);
  const baseUnitPrice = selectedProduct?.unitPrice ?? 0;
  const total = baseUnitPrice * parsedQty;
  const powensEnabled = isBankTransferAvailable(asset);
  const paymentOptions = getCheckoutPaymentOptions(asset);

  useEffect(() => {
    if (!powensEnabled && paymentType === "bank-transfer") {
      setPaymentType("card");
    }
  }, [paymentType, powensEnabled]);

  async function handlePlaceOrder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);

    try {
      const submitResult = await checkoutService.submitCheckout({
        listing,
        asset,
        product: selectedProduct,
        quantity: parsedQty,
        paymentType,
        activeUserId: activeUser?.uid,
        authLoading,
        accessToken,
      });

      if (submitResult.kind === "error") {
        setToast(submitResult.message, submitResult.tone, 2500);
        if (submitResult.redirectToLogin) {
          router.push("/login");
        }
        return;
      }

      if (submitResult.kind === "redirect") {
        window.location.assign(submitResult.url);
        return;
      }

      if (onSuccess) {
        onSuccess(submitResult.orderId);
      } else {
        router.push(`/investor/orders/${submitResult.orderId}`);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to place order";
      setToast(message, "danger", 3000);
    } finally {
      setSubmitting(false);
    }
  }

  if (loadError) {
    return (
      <section>
        <h2>Checkout</h2>
        <p className="muted">{loadError}</p>
      </section>
    );
  }

  if (!listing) {
    return (
      <section>
        <h2>Checkout</h2>
      </section>
    );
  }

  return (
    <div className="vertical-stack-with-gap">
      <header>
        <h1>Checkout</h1>
        <p className="muted">Complete your investment for {listing.title}.</p>
      </header>
      <section className="grid">
        <div>
          <p className="muted">{listing.description}</p>
          <KeyValueList
            items={[
              { label: "Listing", value: listing.title },
              { label: "Country", value: asset?.country ?? "—" },
              { label: "Asset class", value: listing.assetClass },
              { label: "Currency", value: listing.currency },
              ...(asset?.tokenStandard
                ? [
                    {
                      label: "Token standard",
                      value: asset.tokenStandard.toUpperCase(),
                    },
                  ]
                : []),
              ...(asset ? [{ label: "Provider", value: providerName ?? "—" }] : []),
            ]}
          />
        </div>
        <div>
          <Form onSubmit={handlePlaceOrder}>
            {hasSingleProduct ? (
              <FormField label="Product" htmlFor="checkout-product">
                <p className="horizontal-stack">
                  {selectedProduct?.name ?? "Product"} (
                  {selectedProduct?.currency ?? listing.currency}{" "}
                  {selectedProduct?.unitPrice ?? baseUnitPrice})
                </p>
              </FormField>
            ) : (
              <FormField label="Product" htmlFor="checkout-product">
                <FormSelect
                  id="checkout-product"
                  value={selectedProductId}
                  onChange={(event) => setSelectedProductId(event.target.value)}
                  options={products.map((product) => ({
                    value: product.id,
                    label: `${product.name} (${product.currency} ${product.unitPrice})`,
                  }))}
                />
              </FormField>
            )}
            <FormField label="Quantity" htmlFor="checkout-quantity">
              <FormInput
                id="checkout-quantity"
                type="number"
                min={selectedProduct?.minPurchase ?? 1}
                max={selectedProduct?.maxPurchase ?? 100000}
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
              />
            </FormField>
            <FormField label="Payment type" htmlFor="checkout-payment">
              <FormSelect
                id="checkout-payment"
                value={paymentType}
                onChange={(event) =>
                  setPaymentType(event.target.value as CheckoutPaymentType)
                }
                options={paymentOptions}
              />
            </FormField>
            <FormField label="Coupon (optional)" htmlFor="checkout-coupon">
              <FormInput
                id="checkout-coupon"
                value={coupon}
                onChange={(event) => setCoupon(event.target.value)}
                placeholder="SPRING24"
              />
            </FormField>
            <FormField label="Notes" htmlFor="checkout-notes">
              <FormTextarea
                id="checkout-notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={3}
              />
            </FormField>
            <p>
              Unit: {selectedProduct?.currency ?? listing.currency}{" "}
              {baseUnitPrice}
            </p>
            <p>
              Total: {selectedProduct?.currency ?? listing.currency}{" "}
              {Number.isFinite(total) ? total.toFixed(2) : "0.00"}
            </p>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Placing order..." : "Place Order"}
            </Button>
            {mode === "visitor" && !activeUser ? (
              <p className="muted">
                You will need to log in to complete the order.
              </p>
            ) : null}
          </Form>
        </div>
      </section>
    </div>
  );
}
