"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { getController, type ListingWithAssetView } from "@/src/application/controller";
import type { Product } from "@/src/domain/entities";

export function InvestorInvestPageClient() {
  const params = useParams<{ listingId: string; productId: string }>();
  const searchParams = useSearchParams();
  const [listingWithAsset, setListingWithAsset] = useState<ListingWithAssetView | null | undefined>(undefined);
  const [product, setProduct] = useState<Product | null | undefined>(undefined);

  useEffect(() => {
    setListingWithAsset(getController().queries.getListingWithAssetById(params.listingId));
    setProduct(getController().queries.getProductById(params.productId));
  }, [params.listingId, params.productId]);

  if (listingWithAsset === undefined || product === undefined) {
    return <p>Loading checkout...</p>;
  }

  if (!listingWithAsset || !product) {
    return <p>Listing or product not found.</p>;
  }

  const listing = listingWithAsset.listing;

  const quantity = Number(searchParams.get("quantity") ?? String(product.minPurchase));
  const orderId = `order-${product.id}-${quantity}`;

  return (
    <section>
      <h1>Investor checkout</h1>
      <p>{listing.title}</p>
      <p>{product.name}</p>
      <p>
        Total: {quantity * product.unitPrice} {product.currency}
      </p>
      <form action={`/investor/orders/${orderId}`} method="get">
        <input name="listingId" type="hidden" value={listing.id} />
        <input name="productId" type="hidden" value={product.id} />
        <input name="quantity" type="hidden" value={String(quantity)} />
        <button type="submit">Place Order</button>
      </form>
      <p>
        <Link href={`/investor/listings/${listing.id}`}>Back</Link>
      </p>
    </section>
  );
}
