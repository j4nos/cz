"use client";

import { useEffect, useState } from "react";

import {
  getController,
  type PricingTier,
  type ProductPricingState,
} from "@/src/application/controller";

export function PricingPageClient({
  assetId,
  listingId,
}: {
  assetId: string;
  listingId: string;
}) {
  const [state, setState] = useState<ProductPricingState | null>(null);
  const [newTier, setNewTier] = useState({ minQuantity: "1", discountPercent: "0" });
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    setState(getController().queries.getPricingState(listingId));
  }, [listingId]);

  if (!state) {
    return (
      <section>
        <h1>Pricing for {listingId}</h1>
        <p>Loading...</p>
      </section>
    );
  }

  function updateField<Key extends keyof ProductPricingState>(key: Key, value: ProductPricingState[Key]) {
    setState((current) => (current ? { ...current, [key]: value } : current));
  }

  async function handleSave() {
    if (!state) {
      return;
    }

    const saved = await getController().commands.saveProductPricing(state);
    setState(saved);
    setStatusMessage("Product settings saved.");
  }

  function handleAddTier() {
    if (!state) {
      return;
    }

    const minQuantity = Number(newTier.minQuantity);
    const discountPercent = Number(newTier.discountPercent);

    if (minQuantity <= 0 || discountPercent < 0) {
      setStatusMessage("Tier values are invalid.");
      return;
    }

    const tier: PricingTier = {
      id: `${state.listingId}-tier-${Date.now()}`,
      minQuantity,
      discountPercent,
    };

    setState((current) => (current ? { ...current, tiers: [...current.tiers, tier] } : current));
    setNewTier({ minQuantity: "1", discountPercent: "0" });
    setStatusMessage("Pricing tier added.");
  }

  function handleRemoveTier(tierId: string) {
    setState((current) =>
      current
        ? {
            ...current,
            tiers: current.tiers.filter((tier) => tier.id !== tierId),
          }
        : current,
    );
    setStatusMessage("Pricing tier removed.");
  }

  return (
    <section>
      <h1>Pricing for {listingId}</h1>
      <p>Asset: {assetId}</p>

      <form>
        <fieldset>
          <legend>Product attributes</legend>
          <label>
            Product name
            <input
              onChange={(event) => updateField("name", event.target.value)}
              type="text"
              value={state.name}
            />
          </label>
          <label>
            Currency
            <input
              onChange={(event) => updateField("currency", event.target.value)}
              type="text"
              value={state.currency}
            />
          </label>
          <label>
            Unit price
            <input
              min="0"
              onChange={(event) => updateField("unitPrice", Number(event.target.value))}
              type="number"
              value={state.unitPrice}
            />
          </label>
          <label>
            Min purchase
            <input
              min="1"
              onChange={(event) => updateField("minPurchase", Number(event.target.value))}
              type="number"
              value={state.minPurchase}
            />
          </label>
          <label>
            Max purchase
            <input
              min={state.minPurchase}
              onChange={(event) => updateField("maxPurchase", Number(event.target.value))}
              type="number"
              value={state.maxPurchase}
            />
          </label>
          <label>
            Eligible investor type
            <input
              onChange={(event) => updateField("eligibleInvestorType", event.target.value)}
              type="text"
              value={state.eligibleInvestorType}
            />
          </label>
          <label>
            Total supply
            <input
              min="1"
              onChange={(event) => updateField("supplyTotal", Number(event.target.value))}
              type="number"
              value={state.supplyTotal}
            />
          </label>
        </fieldset>
      </form>

      <button onClick={handleSave} type="button">
        Mentés
      </button>
      {statusMessage ? <p>{statusMessage}</p> : null}

      <section>
        <h2>Pricing tiers</h2>
        <form>
          <label>
            Minimum quantity
            <input
              min="1"
              onChange={(event) => setNewTier((current) => ({ ...current, minQuantity: event.target.value }))}
              type="number"
              value={newTier.minQuantity}
            />
          </label>
          <label>
            Discount percent
            <input
              min="0"
              onChange={(event) => setNewTier((current) => ({ ...current, discountPercent: event.target.value }))}
              type="number"
              value={newTier.discountPercent}
            />
          </label>
          <button onClick={handleAddTier} type="button">
            Add pricing tier
          </button>
        </form>

        <table>
          <thead>
            <tr>
              <th>Minimum quantity</th>
              <th>Discount</th>
              <th>Effective unit price</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {state.tiers.length === 0 ? (
              <tr>
                <td colSpan={4}>No pricing tiers configured.</td>
              </tr>
            ) : (
              state.tiers
                .slice()
                .sort((left, right) => left.minQuantity - right.minQuantity)
                .map((tier) => {
                  const effectivePrice = state.unitPrice * (1 - tier.discountPercent / 100);

                  return (
                    <tr key={tier.id}>
                      <td>{tier.minQuantity}</td>
                      <td>{tier.discountPercent}%</td>
                      <td>
                        {effectivePrice} {state.currency}
                      </td>
                      <td>
                        <button onClick={() => handleRemoveTier(tier.id)} type="button">
                          Remove
                        </button>
                      </td>
                    </tr>
                  );
                })
            )}
          </tbody>
        </table>
      </section>
    </section>
  );
}
