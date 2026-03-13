"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { getController, type ListingWithAssetView } from "@/src/application/controller";
import type { Product } from "@/src/domain/entities";

export function CheckoutPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const listingId = searchParams.get("listingId");
  const productId = searchParams.get("productId");
  const [listingWithAsset, setListingWithAsset] = useState<ListingWithAssetView | null | undefined>(undefined);
  const [product, setProduct] = useState<Product | null | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!listingId || !productId) {
      setListingWithAsset(null);
      setProduct(null);
      return;
    }

    setListingWithAsset(getController().queries.getListingWithAssetById(listingId));
    setProduct(getController().queries.getProductById(productId));
  }, [listingId, productId]);

  if (!listingId || !productId) {
    return <p>Missing checkout parameters.</p>;
  }

  if (listingWithAsset === undefined || product === undefined) {
    return <p>Loading checkout...</p>;
  }

  if (!listingWithAsset || !product) {
    return <p>Listing or product not found.</p>;
  }

  const listing = listingWithAsset.listing;

  const quantity = Number(searchParams.get("quantity") ?? "1");
  const coupon = searchParams.get("coupon") ?? "";
  const total = quantity * product.unitPrice;

  async function handlePlaceOrder() {
    if (!product) {
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage("");

      const order = await getController().commands.placeOrder({
        investorId: "investor-1",
        listingId: listing.id,
        productId: product.id,
        quantity,
      });

      const params = new URLSearchParams({
        listingId: order.listingId,
        productId: order.productId,
        quantity: String(order.quantity),
        status: order.status,
      });

      router.push(`/investor/orders/${order.id}?${params.toString()}`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Order placement failed.");
      setIsSubmitting(false);
    }
  }

  return (
    <section>
      <h1>Checkout</h1>
      <p>Listing: {listing.title}</p>
      <p>Product: {product.name}</p>
      <p>Coupon: {coupon || "None"}</p>
      <p>
        Total: {total} {product.currency}
      </p>
      <label>
        Payment type
        <select defaultValue="fake-card">
          <option value="fake-card">Fake card provider</option>
          <option value="fake-bank">Fake bank transfer</option>
        </select>
      </label>
      <button disabled={isSubmitting} onClick={handlePlaceOrder} type="button">
        {isSubmitting ? "Placing order..." : "Place Order"}
      </button>
      {errorMessage ? <p>{errorMessage}</p> : null}
      <p>
        <Link href={`/listings/${listing.id}`}>Back to listing</Link>
      </p>
    </section>
  );
}
