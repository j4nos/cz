"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Carousel } from "@/components/ui/Carousel";
import { Button } from "@/components/ui/Button";
import { Form, FormField, FormInput, FormSelect } from "@/components/ui/Form";
import { createReadController } from "@/src/infrastructure/controllers/createReadController";
import type { PublicListingWithAsset } from "@/src/application/use-cases/publicContent";
import type { Listing as ListingType, Product } from "@/src/domain/entities";

type Props = {
  listingId?: string;
  initialListing?: ListingType | null;
  initialListingWithAsset?: PublicListingWithAsset | null;
  initialProducts?: Product[];
};

export function Listing({
  listingId,
  initialListing = null,
  initialListingWithAsset = null,
  initialProducts = [],
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const readController = useMemo(() => createReadController(), []);

  const derivedListingId =
    listingId ?? initialListing?.id ?? initialListingWithAsset?.listing.id ?? "";

  const [listing, setListing] = useState<ListingType | null>(
    initialListingWithAsset?.listing ?? initialListing
  );
  const [assetImageUrls, setAssetImageUrls] = useState<string[]>(
    initialListingWithAsset?.asset?.imageUrls ?? []
  );
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [selectedProductId, setSelectedProductId] = useState(
    initialProducts[0]?.id ?? ""
  );
  const [quantity, setQuantity] = useState(
    String(initialProducts[0]?.minPurchase ?? 1)
  );
  const [coupon, setCoupon] = useState("");

  useEffect(() => {
    async function load() {
      if (!derivedListingId) {
        setListing(null);
        setProducts([]);
        setAssetImageUrls([]);
        return;
      }

      if (initialListingWithAsset && initialProducts.length > 0) {
        return;
      }

      const nextListing = await readController.getListingById(derivedListingId);
      const nextProducts = await readController.listProductsByListingId(
        derivedListingId
      );
      const nextAsset = nextListing?.assetId
        ? await readController.getAssetById(nextListing.assetId)
        : null;

      setListing(nextListing);
      setProducts(nextProducts);
      setAssetImageUrls(nextAsset?.imageUrls ?? []);
      if (nextProducts.length > 0) {
        setSelectedProductId(nextProducts[0].id);
        setQuantity(String(nextProducts[0].minPurchase || 1));
      }
    }

    void load();
  }, [
    derivedListingId,
    initialListingWithAsset,
    initialProducts.length,
    readController,
  ]);

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === selectedProductId) ?? null,
    [products, selectedProductId]
  );

  const hasSingleProduct = products.length === 1;
  const parsedQty = Number(quantity || 0);
  const baseUnitPrice = selectedProduct?.unitPrice ?? 0;
  const total = baseUnitPrice * parsedQty;

  function goToCheckout(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedProduct || !derivedListingId) {
      return;
    }
    const couponQuery = coupon ? `&coupon=${encodeURIComponent(coupon)}` : "";
    const isInvestorRoute = pathname?.startsWith("/investor/") ?? false;
    if (!isInvestorRoute) {
      router.push(
        `/listings/${derivedListingId}/invest/${selectedProduct.id}?quantity=${quantity}${couponQuery}`
      );
      return;
    }
    router.push(
      `/investor/listings/${derivedListingId}/invest/${selectedProduct.id}?quantity=${quantity}${couponQuery}`
    );
  }

  if (!listing) {
    return <div className="vertical-stack-with-gap"></div>;
  }

  return (
    <div className="vertical-stack-with-gap">
      <header>
        <h1>{listing.title}</h1>
      </header>
      <section className="grid">
        <div>
          {assetImageUrls.length > 0 ? (
            <Carousel images={assetImageUrls} altPrefix={listing.title} />
          ) : null}
        </div>
        <div>
          <p className="muted">{listing.description}</p>
          <Form onSubmit={goToCheckout}>
            {hasSingleProduct ? (
              <FormField label="Product" htmlFor="product">
                <p className="horizontal-stack">
                  {selectedProduct?.name ?? "Product"} (
                  {selectedProduct?.currency ?? listing.currency}{" "}
                  {selectedProduct?.unitPrice ?? baseUnitPrice})
                </p>
              </FormField>
            ) : (
              <FormField label="Product" htmlFor="product">
                <FormSelect
                  id="product"
                  value={selectedProductId}
                  onChange={(event) => setSelectedProductId(event.target.value)}
                  options={products.map((product) => ({
                    value: product.id,
                    label: `${product.name} (${product.currency} ${product.unitPrice})`,
                  }))}
                />
              </FormField>
            )}
            <FormField label="Quantity" htmlFor="quantity">
              <FormInput
                id="quantity"
                type="number"
                min={selectedProduct?.minPurchase ?? 1}
                max={selectedProduct?.maxPurchase ?? 10000}
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
              />
            </FormField>
            <FormField label="Coupon (optional)" htmlFor="coupon">
              <FormInput
                id="coupon"
                value={coupon}
                onChange={(event) => setCoupon(event.target.value)}
                placeholder="SPRING24"
              />
            </FormField>
            <p>
              Unit: {selectedProduct?.currency ?? listing.currency}{" "}
              {baseUnitPrice}
            </p>
            <p>
              Total: {selectedProduct?.currency ?? listing.currency}{" "}
              {total.toFixed(2)}
            </p>
            <Button type="submit">Go to Checkout</Button>
          </Form>
        </div>
      </section>
    </div>
  );
}
