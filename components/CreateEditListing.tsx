"use client";

import { useEffect, useMemo, useState, type MouseEvent } from "react";
import { useRouter } from "next/navigation";

import { AppLink } from "@/components/ui/AppLink";
import { Button } from "@/components/ui/Button";
import {
  Form,
  FormField,
  FormInput,
  FormRow,
  FormSelect,
  FormTextarea,
} from "@/components/ui/Form";
import { PlainCta } from "@/components/sections/PlainCta";
import { Table } from "@/components/ui/Table";
import { useToast } from "@/contexts/ToastContext";
import { getListingOpenRequirementError } from "@/src/application/use-cases/listingOpenRequirements";
import type { Asset, Listing, Product } from "@/src/domain/entities";
import { createReadController } from "@/src/infrastructure/controllers/createReadController";
import { createListingController } from "@/src/infrastructure/controllers/createListingController";
import styles from "./CreateEditListing.module.css";

export function CreateEditListing({
  assetId,
  listingId,
}: {
  assetId: string;
  listingId?: string;
}) {
  const router = useRouter();
  const { setToast } = useToast();
  const generatedListingId = useMemo(() => listingId ?? `listing-local-${Date.now()}`, [listingId]);
  const [currentListingId, setCurrentListingId] = useState(listingId ?? "");
  const [productsVersion, setProductsVersion] = useState(0);
  const [form, setForm] = useState<Listing | null>(null);
  const [asset, setAsset] = useState<Asset | null>(null);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function load() {
      const controller = createReadController();
      const [nextAsset, current] = await Promise.all([
        controller.getAssetById(assetId),
        listingId ? controller.getListingById(listingId) : Promise.resolve(null),
      ]);

      setAsset(nextAsset);
      setCurrentListingId(current?.id ?? "");
      setForm(
        current ?? {
          id: generatedListingId,
          assetId,
          title: "",
          description: "",
          assetClass: nextAsset?.assetClass ?? "REAL_ESTATE",
          eligibility: "ANY",
          currency: "EUR",
          fromPrice: 1000,
          saleStatus: "closed",
          startsAt: "",
          endsAt: "",
        },
      );
      if (current) {
        setForm({
          ...current,
          saleStatus: current.saleStatus === "open" ? "open" : "closed",
        });
      }
    }

    void load();
  }, [assetId, generatedListingId, listingId, productsVersion]);

  useEffect(() => {
    async function loadProducts() {
      if (!currentListingId) {
        setProducts([]);
        return;
      }

      const controller = createReadController();
      const nextProducts = await controller.listProductsByListingId(currentListingId);
      setProducts(nextProducts);
    }

    void loadProducts();
  }, [currentListingId, productsVersion]);

  const missingRequirement = useMemo(() => {
    if (!form) {
      return "";
    }

    return getListingOpenRequirementError({
      listing: form,
      asset,
      products,
    }) ?? "";
  }, [asset, form, products]);

  if (!form) {
    return (
      <section>
        <h1>{listingId ? "Edit listing" : "Create listing"}</h1>
        <p>Loading listing...</p>
      </section>
    );
  }

  function updateField<Key extends keyof Listing>(key: Key, value: Listing[Key]) {
    setForm((current) => (current ? { ...current, [key]: value } : current));
  }

  function handleStatusChange(nextStatus: "open" | "closed") {
    if (!form) {
      return;
    }

    if (form.saleStatus === "open" && nextStatus === "closed") {
      updateField("saleStatus", "closed");
      return;
    }

    if (form.saleStatus === "closed" && nextStatus === "open" && missingRequirement) {
      setToast(missingRequirement, "danger", 2500);
      return;
    }

    updateField("saleStatus", nextStatus);
  }

  async function handleSave(event?: React.FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    if (!form) {
      return;
    }

    if (form.saleStatus === "open") {
      const error = getListingOpenRequirementError({
        listing: { ...form, saleStatus: "closed" },
        asset,
        products,
      });
      if (error) {
        setToast(error, "danger", 2500);
        return;
      }
    }

    const controller = createListingController();

    if (listingId) {
      const saved = await controller.saveListingDraft(form);
      setCurrentListingId(saved.id);
    } else {
      const created = await controller.createListingDraft({
        assetId: form.assetId,
        title: form.title,
        eligibility: form.eligibility,
        currency: form.currency,
        fromPrice: form.fromPrice,
        description: form.description,
        startsAt: form.startsAt,
        endsAt: form.endsAt,
      });
      setCurrentListingId(created.id);
      setForm(created);
      router.replace(`/asset-provider/assets/${assetId}/listings/${created.id}/edit`);
      setToast("Listing saved.", "success", 2000);
      setProductsVersion((current) => current + 1);
      return;
    }
    setToast("Listing saved.", "success", 2000);
    setProductsVersion((current) => current + 1);
  }

  function handleDeleteListing(event?: MouseEvent) {
    event?.preventDefault();
    if (!form) {
      return;
    }

    void createListingController().deleteListing(form.id);
    router.push(`/asset-provider/assets/${assetId}`);
  }

  function handleRemoveProduct(productId: string) {
    if (!form) {
      return;
    }

    void createListingController().removeProduct(productId);
    setProductsVersion((current) => current + 1);
    setToast("Product removed.", "success", 2000);
    router.push(`/asset-provider/assets/${assetId}/listings/${form.id}/edit`);
  }

  function handleCreateProduct() {
    if (!form) {
      return;
    }

    void (async () => {
      const saved = await createListingController().saveListingDraft(form);
      setCurrentListingId(saved.id);
      router.push(`/asset-provider/assets/${assetId}/listings/${saved.id}/pricing`);
    })();
  }

  return (
    <div className="vertical-stack-with-gap">
      {currentListingId && (
        <PlainCta
          title="Listing saved"
          text={`Listing ID: ${currentListingId}`}
          actionLabel="View listing details"
          href={`/listings/${currentListingId}`}
        />
      )}
      <h2>{listingId ? "Edit Listing" : "Create Listing"}</h2>
      <Form onSubmit={handleSave}>
        <FormRow columns={2}>
          <div className="vertical-stack-with-gap">
            <FormField label="Listing title" htmlFor="listing-title">
              <FormInput
                id="listing-title"
                value={form.title}
                onChange={(event) => updateField("title", event.target.value)}
                required
              />
            </FormField>
            <FormField label="Currency" htmlFor="listing-currency">
              <FormSelect
                id="listing-currency"
                value={form.currency}
                options={[
                  { value: "EUR", label: "EUR" },
                  { value: "USD", label: "USD" },
                ]}
                onChange={(event) => updateField("currency", event.target.value)}
              />
            </FormField>
          </div>
          <FormField label="Description" htmlFor="listing-description">
            <FormTextarea
              id="listing-description"
              value={form.description}
              onChange={(event) => updateField("description", event.target.value)}
              rows={4}
            />
          </FormField>
        </FormRow>
        <FormRow columns={2}>
          <FormField label="Sales start" htmlFor="listing-sale-start">
            <FormInput
              id="listing-sale-start"
              type="date"
              value={form.startsAt ?? ""}
              onChange={(event) => updateField("startsAt", event.target.value)}
            />
          </FormField>
          <FormField label="Sales end" htmlFor="listing-sale-end">
            <FormInput
              id="listing-sale-end"
              type="date"
              value={form.endsAt ?? ""}
              onChange={(event) => updateField("endsAt", event.target.value)}
            />
          </FormField>
        </FormRow>
        <FormRow columns={2}>
          <FormField label="From price" htmlFor="listing-from-price">
            <FormInput
              id="listing-from-price"
              type="number"
              min="1"
              step="1"
              value={String(form.fromPrice)}
              onChange={(event) => updateField("fromPrice", Number(event.target.value))}
            />
          </FormField>
          <FormField label="Sale status" htmlFor="listing-sale-status">
            <FormSelect
              id="listing-sale-status"
              value={form.saleStatus}
              options={[
                { value: "open", label: "Open" },
                { value: "closed", label: "Closed" },
              ]}
              onChange={(event) =>
                handleStatusChange(event.target.value as "open" | "closed")
              }
            />
            {missingRequirement ? (
              <p className={styles.hint}>Missing: {missingRequirement}</p>
            ) : null}
          </FormField>
        </FormRow>
        <Button type="submit">Save Listing</Button>
      </Form>
      {currentListingId && (
        <PlainCta
          title="Create product"
          text="Add a product and its pricing tiers on the pricing page."
          actionLabel="Create product"
          href={`/asset-provider/assets/${assetId}/listings/${currentListingId}/pricing/create`}
        />
      )}
      <h2>Products</h2>
      {!currentListingId ? (
        <p className={styles.hint}>Save the listing first to add products.</p>
      ) : (
        <Table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Price</th>
              <th>Min-Max</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td>{product.name}</td>
                <td>
                  {form.currency} {product.unitPrice}
                </td>
                <td>
                  {product.minPurchase}-{product.maxPurchase}
                </td>
                <td>
                  <AppLink
                    looksLikeButton
                    href={`/asset-provider/assets/${assetId}/listings/${currentListingId}/pricing/product/${product.id}`}
                  >
                    Details
                  </AppLink>
                </td>
              </tr>
            ))}
            {products.length === 0 ? (
              <tr>
                <td colSpan={4}>No products yet.</td>
              </tr>
            ) : null}
          </tbody>
        </Table>
      )}
      {currentListingId && (
        <PlainCta
          title="Delete listing"
          text="Deleting this listing also removes all related products and pricing tiers."
          actionLabel="Delete listing"
          href="#"
          onClick={(event) => void handleDeleteListing(event)}
        />
      )}
    </div>
  );
}
