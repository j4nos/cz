"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  getController,
} from "@/src/application/controller";
import type { Listing } from "@/src/domain/entities";

function today() {
  return new Date().toISOString().slice(0, 10);
}

function isWithinWindow(startsAt?: string, endsAt?: string) {
  if (!startsAt || !endsAt) {
    return false;
  }

  const current = today();
  return startsAt <= current && current <= endsAt;
}

export function CreateEditListingClient({
  assetId,
  listingId,
}: {
  assetId: string;
  listingId?: string;
}) {
  const router = useRouter();
  const generatedListingId = useMemo(() => listingId ?? `listing-local-${Date.now()}`, [listingId]);
  const [statusMessage, setStatusMessage] = useState("");
  const [productsVersion, setProductsVersion] = useState(0);
  const [form, setForm] = useState<Listing | null>(null);

  useEffect(() => {
    const runtime = getController();
    const asset = runtime.queries.getAssetById(assetId);
    const current = listingId ? runtime.queries.getListingById(listingId) : null;

    setForm(
      current ?? {
        id: generatedListingId,
        assetId,
        title: "",
        description: "",
        assetClass: asset?.assetClass ?? "REAL_ESTATE",
        eligibility: "ANY",
        currency: "EUR",
        fromPrice: 1000,
        saleStatus: "CLOSED",
        startsAt: "",
        endsAt: "",
      },
    );
  }, [assetId, generatedListingId, listingId, productsVersion]);
  const missingRequirement = useMemo(() => {
    if (!form) {
      return "";
    }

    const runtime = getController();
    const asset = runtime.queries.getAssetById(form.assetId);
    const products = runtime.queries.getProductsByListingId(form.id);

    if (!isWithinWindow(form.startsAt, form.endsAt)) {
      return "Add a start and end date, and make sure today is between them.";
    }

    if (!asset || asset.imageUrls.length === 0) {
      return "Add at least one photo.";
    }

    if (products.length === 0) {
      return "Add at least one product.";
    }

    return "";
  }, [form]);

  if (!form) {
    return (
      <section>
        <h1>{listingId ? "Edit listing" : "Create listing"}</h1>
        <p>Loading listing...</p>
      </section>
    );
  }

  const products = getController().queries.getProductsByListingId(form.id);

  function updateField<Key extends keyof Listing>(key: Key, value: Listing[Key]) {
    setForm((current) => (current ? { ...current, [key]: value } : current));
  }

  function handleStatusChange(nextStatus: "OPEN" | "CLOSED") {
    if (!form) {
      return;
    }

    if (form.saleStatus === "OPEN" && nextStatus === "CLOSED") {
      updateField("saleStatus", "CLOSED");
      return;
    }

    if (form.saleStatus === "CLOSED" && nextStatus === "OPEN" && missingRequirement) {
      setStatusMessage(missingRequirement);
      return;
    }

    updateField("saleStatus", nextStatus);
  }

  async function handleSave() {
    if (!form) {
      return;
    }

    if (listingId) {
      getController().commands.saveListingDraft(form);
    } else {
      const created = await getController().commands.createListingDraft({
        assetId: form.assetId,
        title: form.title,
        eligibility: form.eligibility,
        currency: form.currency,
        fromPrice: form.fromPrice,
        description: form.description,
        startsAt: form.startsAt,
        endsAt: form.endsAt,
      });
      setForm(created);
      router.push(`/asset-provider/assets/${assetId}/listings/${created.id}/edit`);
    }
    setStatusMessage("Listing saved.");
    setProductsVersion((current) => current + 1);
  }

  function handleDeleteListing() {
    if (!form) {
      return;
    }

    getController().commands.deleteListing(form.id);
    router.push(`/asset-provider/assets/${assetId}`);
  }

  function handleRemoveProduct(productId: string) {
    if (!form) {
      return;
    }

    getController().commands.removeProduct(productId);
    setProductsVersion((current) => current + 1);
    setStatusMessage("Product removed.");
    router.push(`/asset-provider/assets/${assetId}/listings/${form.id}/edit`);
  }

  function handleCreateProduct() {
    if (!form) {
      return;
    }

    getController().commands.saveListingDraft(form);
    router.push(`/asset-provider/assets/${assetId}/listings/${form.id}/pricing`);
  }

  return (
    <section>
      <h1>{listingId ? "Edit listing" : "Create listing"}</h1>
      <form>
        <label>
          Title
          <input onChange={(event) => updateField("title", event.target.value)} type="text" value={form.title} />
        </label>
        <label>
          Description
          <textarea onChange={(event) => updateField("description", event.target.value)} value={form.description} />
        </label>
        <label>
          Eligibility
          <input
            onChange={(event) => updateField("eligibility", event.target.value)}
            type="text"
            value={form.eligibility}
          />
        </label>
        <label>
          Currency
          <input onChange={(event) => updateField("currency", event.target.value)} type="text" value={form.currency} />
        </label>
        <label>
          From price
          <input
            min="1"
            onChange={(event) => updateField("fromPrice", Number(event.target.value))}
            type="number"
            value={form.fromPrice}
          />
        </label>
        <label>
          Start date
          <input onChange={(event) => updateField("startsAt", event.target.value)} type="date" value={form.startsAt ?? ""} />
        </label>
        <label>
          End date
          <input onChange={(event) => updateField("endsAt", event.target.value)} type="date" value={form.endsAt ?? ""} />
        </label>
        <label>
          Sales status
          <select onChange={(event) => handleStatusChange(event.target.value as "OPEN" | "CLOSED")} value={form.saleStatus}>
            <option value="CLOSED">Closed</option>
            <option value="OPEN">Open</option>
          </select>
        </label>
      </form>

      {form.saleStatus === "CLOSED" && missingRequirement ? <p>Missing requirement: {missingRequirement}</p> : null}
      {statusMessage ? <p>{statusMessage}</p> : null}

      <button onClick={handleSave} type="button">
        Save
      </button>

      <p>
        <Link href={`/listings/${form.id}`}>Listing details</Link>
      </p>
      <p>
        <button onClick={handleCreateProduct} type="button">
          Create product
        </button>
      </p>

      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.length === 0 ? (
            <tr>
              <td colSpan={2}>No products yet.</td>
            </tr>
          ) : (
            products.map((product) => (
              <tr key={product.id}>
                <td>{product.name}</td>
                <td>
                  <Link href={`/asset-provider/assets/${assetId}/listings/${form.id}/pricing`}>Details</Link>{" "}
                  <button onClick={() => handleRemoveProduct(product.id)} type="button">
                    Remove Product
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <button onClick={handleDeleteListing} type="button">
        Delete listing
      </button>
    </section>
  );
}
