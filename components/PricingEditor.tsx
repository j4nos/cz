"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { PlainCta } from "@/components/sections/PlainCta";
import { Button } from "@/components/ui/Button";
import {
  Form,
  FormField,
  FormInput,
  FormSelect,
} from "@/components/ui/Form";
import { Table } from "@/components/ui/Table";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import {
  addPricingTierToState,
  buildPricingTier,
  getPricingStateError,
  getPricingTierInputError,
  removePricingTierFromState,
} from "@/src/application/use-cases/pricingRules";
import { normalizeCouponCode } from "@/src/domain/policies/productCouponPolicy";
import {
  type PricingTier,
  type ProductPricingState,
} from "@/src/application/dto/pricingState";
import type { EligibleInvestorType } from "@/src/domain/entities";
import { createProductPricingFacade } from "@/src/presentation/composition/client";

type Props = {
  assetId: string;
  listingId: string;
  mode: "create" | "edit";
  preselectedProductId?: string;
  redirectAfterDelete?: string;
};

export function PricingEditor({
  assetId,
  listingId,
  mode,
  preselectedProductId,
  redirectAfterDelete,
}: Props) {
  const router = useRouter();
  const { accessToken } = useAuth();
  const currentProductPath = preselectedProductId
    ? `/asset-provider/assets/${assetId}/listings/${listingId}/pricing/product/${preselectedProductId}`
    : "";
  const { setToast } = useToast();
  const productPricingService = useMemo(() => createProductPricingFacade(), []);
  const [state, setState] = useState<ProductPricingState | null>(null);
  const [minQuantity, setMinQuantity] = useState("1");
  const [discountPercent, setDiscountPercent] = useState("0");
  const [couponCode, setCouponCode] = useState("");
  const [couponPrice, setCouponPrice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const nextState = await productPricingService.loadPricingState(
        listingId,
        preselectedProductId
      );
      setState(mode === "create" ? { ...nextState, productId: "" } : nextState);
    }

    void load();
  }, [listingId, mode, preselectedProductId, productPricingService]);

  function updateField<Key extends keyof ProductPricingState>(
    key: Key,
    value: ProductPricingState[Key]
  ) {
    setState((current) => (current ? { ...current, [key]: value } : current));
  }

  async function persistState(nextState: ProductPricingState) {
    const saved = await productPricingService.savePricingState({
      state: nextState,
      listingId,
      accessToken,
    });
    setState(saved);
    if (saved.productId) {
      const nextProductPath = `/asset-provider/assets/${assetId}/listings/${listingId}/pricing/product/${saved.productId}`;
      if (nextProductPath !== currentProductPath) {
        router.replace(nextProductPath);
      }
    }
    return saved;
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!state) {
      return;
    }

    const pricingError = getPricingStateError(state);
    if (pricingError) {
      setError(pricingError);
      return;
    }

    try {
      setError("");
      const saved = await persistState(state);
      setToast(saved.productId ? "Product saved." : "Product created.", "success", 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot save product.");
    }
  }

  function handleAddTier(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!state) {
      return;
    }

    const nextMinQuantity = Number(minQuantity);
    const nextDiscountPercent = Number(discountPercent);

    const tierError = getPricingTierInputError({
      minQuantity: nextMinQuantity,
      discountPercent: nextDiscountPercent,
    });
    if (tierError) {
      setError(tierError);
      return;
    }

    const tier: PricingTier = buildPricingTier({
      listingId: state.listingId,
      minQuantity: nextMinQuantity,
      discountPercent: nextDiscountPercent,
    });

    setState((current) => (current ? addPricingTierToState(current, tier) : current));
    setMinQuantity("1");
    setDiscountPercent("0");
    setToast("Pricing tier added.", "success", 2000);
  }

  function handleRemoveTier(tierId: string) {
    setState((current) => (current ? removePricingTierFromState(current, tierId) : current));
    setToast("Pricing tier removed.", "success", 2000);
  }

  async function handleAddCoupon(event?: FormEvent) {
    event?.preventDefault();
    if (!state) {
      return;
    }

    const nextCode = normalizeCouponCode(couponCode);
    const nextPrice = Number(couponPrice);

    if (!nextCode) {
      const message = "Coupon code is required.";
      setError(message);
      setToast(message, "danger", 2200);
      return;
    }
    if (!Number.isFinite(nextPrice) || nextPrice < 0) {
      const message = "Coupon price must be a valid non-negative number.";
      setError(message);
      setToast(message, "danger", 2200);
      return;
    }
    if (nextPrice >= state.unitPrice) {
      const message = "Coupon price must be lower than the base unit price.";
      setError(message);
      setToast(message, "danger", 2200);
      return;
    }
    if (state.coupons.some((coupon) => coupon.code === nextCode)) {
      const message = "Coupon code already exists for this product.";
      setError(message);
      setToast(message, "danger", 2200);
      return;
    }

    setError("");
    const nextState = {
      ...state,
      coupons: [...state.coupons, { code: nextCode, discountedUnitPrice: nextPrice }],
    };
    setState(nextState);
    if (nextState.productId) {
      try {
        await persistState(nextState);
      } catch (err) {
        setState(state);
        const message = err instanceof Error ? err.message : "Cannot save coupon.";
        setError(message);
        setToast(message, "danger", 2600);
        return;
      }
    }
    setCouponCode("");
    setCouponPrice("");
    setToast("Coupon added.", "success", 2000);
  }

  async function handleRemoveCoupon(code: string) {
    if (!state) {
      return;
    }

    const nextState = {
      ...state,
      coupons: state.coupons.filter((coupon) => coupon.code !== code),
    };
    setState(nextState);
    if (nextState.productId) {
      try {
        await persistState(nextState);
      } catch (err) {
        setState(state);
        const message = err instanceof Error ? err.message : "Cannot remove coupon.";
        setError(message);
        setToast(message, "danger", 2600);
        return;
      }
    }
    setToast("Coupon removed.", "success", 2000);
  }

  async function handleDeleteProduct(
    event: React.MouseEvent<HTMLAnchorElement>
  ) {
    event.preventDefault();
    if (!state?.productId) {
      return;
    }

    const confirmed = window.confirm(
      "Delete this product? Pricing tiers will be removed too."
    );
    if (!confirmed) {
      return;
    }

    try {
      setError("");
      await productPricingService.deleteProduct(state.productId);
      router.push(
        redirectAfterDelete ??
          `/asset-provider/assets/${assetId}/listings/${listingId}/edit`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot delete product.");
    }
  }

  if (!state) {
    return null;
  }

  return (
    <div className="vertical-stack-with-gap">
      <header>
        <h1>Pricing tiers</h1>
      </header>

      <section>
        {error ? <p className="muted">{error}</p> : null}
        <Form onSubmit={handleSave}>
          <FormField label="Name" htmlFor="product-name">
            <FormInput
              id="product-name"
              value={state.name}
              onChange={(event) => updateField("name", event.target.value)}
              required
            />
          </FormField>
          <FormField label="Currency" htmlFor="product-currency">
            <FormSelect
              id="product-currency"
              value={state.currency}
              options={[
                { value: "EUR", label: "EUR" },
                { value: "USD", label: "USD" },
              ]}
              onChange={(event) => updateField("currency", event.target.value)}
            />
          </FormField>
          <FormField label="Unit price" htmlFor="product-price">
            <FormInput
              id="product-price"
              type="number"
              min="0"
              value={String(state.unitPrice)}
              onChange={(event) =>
                updateField("unitPrice", Number(event.target.value))
              }
              required
            />
          </FormField>
          <FormField label="Min purchase" htmlFor="product-min">
            <FormInput
              id="product-min"
              type="number"
              min="1"
              value={String(state.minPurchase)}
              onChange={(event) =>
                updateField("minPurchase", Number(event.target.value))
              }
              required
            />
          </FormField>
          <FormField label="Max purchase" htmlFor="product-max">
            <FormInput
              id="product-max"
              type="number"
              min={String(state.minPurchase || 1)}
              value={String(state.maxPurchase)}
              onChange={(event) =>
                updateField("maxPurchase", Number(event.target.value))
              }
              required
            />
          </FormField>
          <FormField label="Eligible investor" htmlFor="product-eligibility">
            <FormSelect
              id="product-eligibility"
              value={state.eligibleInvestorType}
              options={[
                { value: "ANY", label: "Any" },
                { value: "PROFESSIONAL", label: "Professional" },
                { value: "RETAIL", label: "Retail" },
              ]}
              onChange={(event) =>
                updateField(
                  "eligibleInvestorType",
                  event.target.value as EligibleInvestorType,
                )
              }
            />
          </FormField>
          <FormField label="Supply total" htmlFor="product-supply-total">
            <FormInput
              id="product-supply-total"
              type="number"
              min="1"
              value={String(state.supplyTotal)}
              onChange={(event) =>
                updateField("supplyTotal", Number(event.target.value))
              }
              required
            />
          </FormField>
          <Button type="submit">
            {state.productId ? "Save product" : "Create product"}
          </Button>
        </Form>

        <br />

        <Form onSubmit={handleAddTier}>
          <FormField label="Min quantity" htmlFor="pricing-min">
            <FormInput
              id="pricing-min"
              type="number"
              min="1"
              value={minQuantity}
              onChange={(event) => setMinQuantity(event.target.value)}
            />
          </FormField>
          <FormField
            label="Discounted unit price"
            htmlFor="pricing-discount"
          >
            <FormInput
              id="pricing-discount"
              type="number"
              min="0"
              value={discountPercent}
              onChange={(event) => setDiscountPercent(event.target.value)}
            />
          </FormField>
          <Button type="submit">Add tier</Button>
        </Form>

        <br />

        <Form onSubmit={handleAddCoupon}>
          <FormField label="Coupon code" htmlFor="product-coupon-code">
            <FormInput
              id="product-coupon-code"
              value={couponCode}
              onChange={(event) => setCouponCode(event.target.value)}
              placeholder="SPRING24"
            />
          </FormField>
          <FormField label="Discounted unit price" htmlFor="product-coupon-price">
            <FormInput
              id="product-coupon-price"
              type="number"
              min="0"
              value={couponPrice}
              onChange={(event) => setCouponPrice(event.target.value)}
              placeholder="850"
            />
          </FormField>
          <Button type="button" onClick={handleAddCoupon}>
            Add coupon
          </Button>
        </Form>
      </section>

      <section>
        <h3>Existing tiers</h3>
        <Table>
          <thead>
            <tr>
              <th>Min qty</th>
              <th>Price</th>
              <th>Remove</th>
            </tr>
          </thead>
          <tbody>
            {state.tiers.map((tier) => (
              <tr key={tier.id}>
                <td>{tier.minQuantity}</td>
                <td>{tier.discountPercent}</td>
                <td>
                  <Button
                    variant="ghost"
                    type="button"
                    onClick={() => handleRemoveTier(tier.id)}
                  >
                    Remove
                  </Button>
                </td>
              </tr>
            ))}
            {state.tiers.length === 0 ? (
              <tr>
                <td colSpan={3}>No tiers yet.</td>
              </tr>
            ) : null}
          </tbody>
        </Table>
      </section>

      <section>
        <h3>Coupons</h3>
        <Table>
          <thead>
            <tr>
              <th>Code</th>
              <th>Discounted price</th>
              <th>Remove</th>
            </tr>
          </thead>
          <tbody>
            {state.coupons.map((coupon) => (
              <tr key={coupon.code}>
                <td>{coupon.code}</td>
                <td>
                  {state.currency} {coupon.discountedUnitPrice}
                </td>
                <td>
                  <Button
                    variant="ghost"
                    type="button"
                    onClick={() => handleRemoveCoupon(coupon.code)}
                  >
                    Remove
                  </Button>
                </td>
              </tr>
            ))}
            {state.coupons.length === 0 ? (
              <tr>
                <td colSpan={3}>No coupons yet.</td>
              </tr>
            ) : null}
          </tbody>
        </Table>
      </section>

      {state.productId ? (
        <section>
          <PlainCta
            title="Delete product"
            text="Removes the selected product and all its pricing tiers."
            actionLabel="Delete Product"
            href="#"
            onClick={handleDeleteProduct}
          />
        </section>
      ) : null}
    </div>
  );
}
