"use client";

import { useEffect, useMemo, useReducer, type FormEvent } from "react";
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

type PricingEditorLocalState = {
  pricingState: ProductPricingState | null;
  minQuantity: string;
  discountPercent: string;
  couponCode: string;
  couponPrice: string;
  error: string;
};

type PricingEditorAction =
  | { type: "load_success"; payload: ProductPricingState }
  | { type: "update_field"; key: keyof ProductPricingState; value: ProductPricingState[keyof ProductPricingState] }
  | { type: "set_error"; payload: string }
  | { type: "clear_error" }
  | { type: "add_tier"; payload: PricingTier }
  | { type: "remove_tier"; payload: string }
  | { type: "set_min_quantity"; payload: string }
  | { type: "set_discount_percent"; payload: string }
  | { type: "set_coupon_code"; payload: string }
  | { type: "set_coupon_price"; payload: string }
  | { type: "replace_pricing_state"; payload: ProductPricingState }
  | { type: "add_coupon"; payload: { code: string; discountedUnitPrice: number } }
  | { type: "remove_coupon"; payload: string }
  | { type: "reset_tier_inputs" }
  | { type: "reset_coupon_inputs" };

const initialPricingEditorState: PricingEditorLocalState = {
  pricingState: null,
  minQuantity: "1",
  discountPercent: "0",
  couponCode: "",
  couponPrice: "",
  error: "",
};

function pricingEditorReducer(
  state: PricingEditorLocalState,
  action: PricingEditorAction,
): PricingEditorLocalState {
  switch (action.type) {
    case "load_success":
      return { ...state, pricingState: action.payload };
    case "update_field":
      return state.pricingState
        ? {
            ...state,
            pricingState: { ...state.pricingState, [action.key]: action.value },
          }
        : state;
    case "set_error":
      return { ...state, error: action.payload };
    case "clear_error":
      return { ...state, error: "" };
    case "add_tier":
      return state.pricingState
        ? {
            ...state,
            pricingState: addPricingTierToState(state.pricingState, action.payload),
          }
        : state;
    case "remove_tier":
      return state.pricingState
        ? {
            ...state,
            pricingState: removePricingTierFromState(state.pricingState, action.payload),
          }
        : state;
    case "set_min_quantity":
      return { ...state, minQuantity: action.payload };
    case "set_discount_percent":
      return { ...state, discountPercent: action.payload };
    case "set_coupon_code":
      return { ...state, couponCode: action.payload };
    case "set_coupon_price":
      return { ...state, couponPrice: action.payload };
    case "replace_pricing_state":
      return { ...state, pricingState: action.payload };
    case "add_coupon":
      return state.pricingState
        ? {
            ...state,
            pricingState: {
              ...state.pricingState,
              coupons: [...state.pricingState.coupons, action.payload],
            },
          }
        : state;
    case "remove_coupon":
      return state.pricingState
        ? {
            ...state,
            pricingState: {
              ...state.pricingState,
              coupons: state.pricingState.coupons.filter((coupon) => coupon.code !== action.payload),
            },
          }
        : state;
    case "reset_tier_inputs":
      return { ...state, minQuantity: "1", discountPercent: "0" };
    case "reset_coupon_inputs":
      return { ...state, couponCode: "", couponPrice: "" };
    default:
      return state;
  }
}

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
  const [editorState, dispatch] = useReducer(pricingEditorReducer, initialPricingEditorState);
  const { pricingState: state, minQuantity, discountPercent, couponCode, couponPrice, error } =
    editorState;

  useEffect(() => {
    async function load() {
      const nextState = await productPricingService.loadPricingState(
        listingId,
        preselectedProductId
      );
      dispatch({
        type: "load_success",
        payload: mode === "create" ? { ...nextState, productId: "" } : nextState,
      });
    }

    void load();
  }, [listingId, mode, preselectedProductId, productPricingService]);

  function updateField<Key extends keyof ProductPricingState>(
    key: Key,
    value: ProductPricingState[Key]
  ) {
    dispatch({ type: "update_field", key, value });
  }

  async function persistState(nextState: ProductPricingState) {
    const saved = await productPricingService.savePricingState({
      state: nextState,
      listingId,
      accessToken,
    });
    dispatch({ type: "replace_pricing_state", payload: saved });
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
      dispatch({ type: "set_error", payload: pricingError });
      return;
    }

    try {
      dispatch({ type: "clear_error" });
      const saved = await persistState(state);
      setToast(saved.productId ? "Product saved." : "Product created.", "success", 2000);
    } catch (err) {
      dispatch({ type: "set_error", payload: err instanceof Error ? err.message : "Cannot save product." });
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
      dispatch({ type: "set_error", payload: tierError });
      return;
    }

    const tier: PricingTier = buildPricingTier({
      listingId: state.listingId,
      minQuantity: nextMinQuantity,
      discountPercent: nextDiscountPercent,
    });

    dispatch({ type: "add_tier", payload: tier });
    dispatch({ type: "reset_tier_inputs" });
    setToast("Pricing tier added.", "success", 2000);
  }

  function handleRemoveTier(tierId: string) {
    dispatch({ type: "remove_tier", payload: tierId });
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
      dispatch({ type: "set_error", payload: message });
      setToast(message, "danger", 2200);
      return;
    }
    if (!Number.isFinite(nextPrice) || nextPrice < 0) {
      const message = "Coupon price must be a valid non-negative number.";
      dispatch({ type: "set_error", payload: message });
      setToast(message, "danger", 2200);
      return;
    }
    if (nextPrice >= state.unitPrice) {
      const message = "Coupon price must be lower than the base unit price.";
      dispatch({ type: "set_error", payload: message });
      setToast(message, "danger", 2200);
      return;
    }
    if (state.coupons.some((coupon) => coupon.code === nextCode)) {
      const message = "Coupon code already exists for this product.";
      dispatch({ type: "set_error", payload: message });
      setToast(message, "danger", 2200);
      return;
    }

    dispatch({ type: "clear_error" });
    const nextState = {
      ...state,
      coupons: [...state.coupons, { code: nextCode, discountedUnitPrice: nextPrice }],
    };
    dispatch({ type: "add_coupon", payload: { code: nextCode, discountedUnitPrice: nextPrice } });
    if (nextState.productId) {
      try {
        await persistState(nextState);
      } catch (err) {
        dispatch({ type: "replace_pricing_state", payload: state });
        const message = err instanceof Error ? err.message : "Cannot save coupon.";
        dispatch({ type: "set_error", payload: message });
        setToast(message, "danger", 2600);
        return;
      }
    }
    dispatch({ type: "reset_coupon_inputs" });
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
    dispatch({ type: "remove_coupon", payload: code });
    if (nextState.productId) {
      try {
        await persistState(nextState);
      } catch (err) {
        dispatch({ type: "replace_pricing_state", payload: state });
        const message = err instanceof Error ? err.message : "Cannot remove coupon.";
        dispatch({ type: "set_error", payload: message });
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
      dispatch({ type: "clear_error" });
      await productPricingService.deleteProduct(state.productId);
      router.push(
        redirectAfterDelete ??
          `/asset-provider/assets/${assetId}/listings/${listingId}/edit`
      );
    } catch (err) {
      dispatch({ type: "set_error", payload: err instanceof Error ? err.message : "Cannot delete product." });
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
              onChange={(event) => dispatch({ type: "set_min_quantity", payload: event.target.value })}
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
              onChange={(event) => dispatch({ type: "set_discount_percent", payload: event.target.value })}
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
              onChange={(event) => dispatch({ type: "set_coupon_code", payload: event.target.value })}
              placeholder="SPRING24"
            />
          </FormField>
          <FormField label="Discounted unit price" htmlFor="product-coupon-price">
            <FormInput
              id="product-coupon-price"
              type="number"
              min="0"
              value={couponPrice}
              onChange={(event) => dispatch({ type: "set_coupon_price", payload: event.target.value })}
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
