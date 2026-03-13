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

  const [listing, setListing] = useState<Listing | null>(null);
  const [asset, setAsset] = useState<Asset | null>(null);
  const [providerName, setProviderName] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const productIdParam = searchParams.get("productId") ?? "";
  const [selectedProductId, setSelectedProductId] = useState(
    productIdParam || productId || ""
  );
  const [quantity, setQuantity] = useState(String(initialQuantity ?? 1));
  const [paymentType, setPaymentType] = useState("card");
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
        const nextListing = await readController.getListingById(listingId);
        const nextAsset = nextListing?.assetId
          ? await readController.getAssetById(nextListing.assetId)
          : null;
        const listingProducts = await readController.listProductsByListingId(
          listingId
        );
        const defaultProductId =
          productIdParam || productId || listingProducts[0]?.id || "";
        const defaultProduct =
          listingProducts.find((item) => item.id === defaultProductId) ??
          listingProducts[0] ??
          null;

        setListing(nextListing);
        setAsset(nextAsset);
        setProducts(listingProducts);
        setSelectedProductId((current) => current || defaultProductId);
        if (defaultProduct) {
          setQuantity(String(initialQuantity ?? defaultProduct.minPurchase ?? 1));
        }
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
    readController,
    setLoading,
  ]);

  useEffect(() => {
    let active = true;

    async function loadProvider() {
      if (!asset?.tenantUserId) {
        setProviderName(null);
        return;
      }

      try {
        const providerProfile = await authClient.getUserProfile(asset.tenantUserId);
        const companyName = providerProfile?.companyName?.trim() || null;
        if (!active) {
          return;
        }
        setProviderName(companyName);
      } catch {
        if (!active) {
          return;
        }
        setProviderName(null);
      }
    }

    void loadProvider();

    return () => {
      active = false;
    };
  }, [asset?.tenantUserId, authClient]);

  const selectedProduct = useMemo(
    () => products.find((item) => item.id === selectedProductId) ?? null,
    [products, selectedProductId]
  );

  const hasSingleProduct = products.length === 1;
  const parsedQty = Number(quantity || 0);
  const baseUnitPrice = selectedProduct?.unitPrice ?? 0;
  const total = baseUnitPrice * parsedQty;
  const powensEnabled = Boolean(
    asset?.beneficiaryIban?.trim() && asset?.beneficiaryLabel?.trim()
  );

  useEffect(() => {
    if (!powensEnabled && paymentType === "bank-transfer") {
      setPaymentType("card");
    }
  }, [paymentType, powensEnabled]);

  async function handlePlaceOrder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedProduct || !listing) {
      setToast("Missing listing or product.", "danger", 2500);
      return;
    }

    if (!activeUser && !authLoading) {
      setToast("Login required to place order.", "warning", 2500);
      router.push("/login");
      return;
    }

    if (!activeUser) {
      setToast("Login required to place order.", "warning", 2500);
      return;
    }

    setSubmitting(true);

    try {
      const order = await createOrderController().placeOrder({
        investorId: activeUser.uid,
        listingId: listing.id,
        productId: selectedProduct.id,
        quantity: parsedQty,
        paymentProvider: paymentType,
      });

      if (paymentType === "bank-transfer") {
        if (!accessToken) {
          throw new Error("Missing access token for bank transfer.");
        }
        const response = await fetch("/api/powens/create-payment", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ orderId: order.id }),
        });
        const payload = (await response.json()) as {
          redirectUrl?: string;
          error?: string;
        };
        if (!response.ok || !payload.redirectUrl) {
          throw new Error(payload.error || "Failed to start bank transfer.");
        }
        window.location.assign(payload.redirectUrl);
        return;
      }

      if (onSuccess) {
        onSuccess(order.id);
      } else {
        router.push(`/investor/orders/${order.id}`);
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
                onChange={(event) => setPaymentType(event.target.value)}
                options={[
                  { value: "card", label: "Card" },
                  ...(powensEnabled
                    ? [
                        {
                          value: "bank-transfer",
                          label: "Bank transfer (Powens)",
                        },
                      ]
                    : []),
                ]}
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
