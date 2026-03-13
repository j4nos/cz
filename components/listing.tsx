"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { getController, type ListingWithAssetView } from "@/src/application/controller";

export function ListingDetails({ listingWithAsset, checkoutPath = "/checkout" }: { listingWithAsset: ListingWithAssetView; checkoutPath?: string }) {
  const router = useRouter();
  const listing = listingWithAsset.listing;
  const asset = listingWithAsset.asset;
  const [productOptions, setProductOptions] = useState(() => getController().queries.getProductsByListingId(listing.id));
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [coupon, setCoupon] = useState("");

  useEffect(() => {
    const nextProducts = getController().queries.getProductsByListingId(listing.id);
    setProductOptions(nextProducts);

    const nextSelectedProduct = nextProducts[0];
    setSelectedProductId(nextSelectedProduct?.id ?? "");
    setQuantity(nextSelectedProduct?.minPurchase ?? 1);
  }, [listing.id]);

  const selectedProduct = productOptions.find((product) => product.id === selectedProductId) ?? productOptions[0];
  const minimumQuantity = selectedProduct?.minPurchase ?? 1;
  const total = selectedProduct ? selectedProduct.unitPrice * quantity : listing.fromPrice;

  function handleProductChange(nextProductId: string) {
    setSelectedProductId(nextProductId);
    const nextProduct = productOptions.find((product) => product.id === nextProductId);
    setQuantity(nextProduct?.minPurchase ?? 1);
  }

  function handleCheckout() {
    if (!selectedProduct) {
      return;
    }

    const params = new URLSearchParams({
      listingId: listing.id,
      productId: selectedProduct.id,
      quantity: String(quantity),
    });

    if (coupon) {
      params.set("coupon", coupon);
    }

    router.push(`${checkoutPath}?${params.toString()}`);
  }

  return (
    <article>
      <div>
        {(asset?.imageUrls ?? []).map((photo, index) => (
          <img key={`${listing.id}-${index}`} alt={`${asset?.name ?? "Asset"} ${index + 1}`} src={photo} />
        ))}
      </div>
      <div>
        <h1>{listing.title}</h1>
        <p>{listing.description}</p>
        {productOptions.length > 1 ? (
          <label>
            Product
            <select onChange={(event) => handleProductChange(event.target.value)} value={selectedProduct?.id ?? ""}>
              {productOptions.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <label>
          Quantity
          <input
            min={minimumQuantity}
            onChange={(event) => setQuantity(Math.max(minimumQuantity, Number(event.target.value) || minimumQuantity))}
            type="number"
            value={quantity}
          />
        </label>
        <label>
          Coupon
          <input onChange={(event) => setCoupon(event.target.value)} placeholder="Optional" type="text" value={coupon} />
        </label>
        <p>
          Price: {total} {selectedProduct?.currency ?? listing.currency}
        </p>
        <button disabled={!selectedProduct} onClick={handleCheckout} type="button">
          Go to Checkout
        </button>
        <p>
          Quick flow:{" "}
          <Link href={`/investor/listings/${listing.id}/invest/${selectedProduct?.id}?quantity=${minimumQuantity}`}>
            Investor checkout
          </Link>
        </p>
      </div>
    </article>
  );
}
