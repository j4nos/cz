"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { KeyValueList } from "@/components/ui/KeyValueList";
import { useAuth } from "@/contexts/AuthContext";
import type { PublicListingWithAsset } from "@/src/application/use-cases/publicContent";
import type { Order } from "@/src/domain/entities";
import { createReadPort } from "@/src/presentation/composition/client";

type Props = {
  orderId: string;
  initialOrder?: Order | null;
  initialListingWithAsset?: PublicListingWithAsset | null;
  initialProductName?: string | null;
};

export function InvestorOrder({
  orderId,
  initialOrder,
  initialListingWithAsset,
  initialProductName,
}: Props) {
  const { activeUser } = useAuth();
  const readController = useMemo(() => createReadPort(), []);
  const [order, setOrder] = useState<Order | null | undefined>(
    initialOrder === undefined ? undefined : initialOrder
  );
  const [fallbackListingTitle, setFallbackListingTitle] = useState<
    string | null
  >(initialListingWithAsset?.listing.title ?? null);
  const [fallbackProductName, setFallbackProductName] = useState<string | null>(
    initialProductName ?? null
  );

  useEffect(() => {
    if (initialOrder !== undefined) {
      return;
    }

    async function load() {
      const orders = activeUser
        ? await readController.listOrdersByInvestor(activeUser.uid)
        : [];
      const next = orders.find((item) => item.id === orderId) ?? null;
      setOrder(next);
    }

    void load();
  }, [activeUser, initialOrder, orderId, readController]);

  useEffect(() => {
    async function loadRelated() {
      if (!order) {
        return;
      }

      if (!fallbackListingTitle) {
        const listing = await readController.getListingById(order.listingId);
        setFallbackListingTitle(listing?.title ?? null);
      }
      if (!fallbackProductName) {
        const product = await readController.getProductById(order.productId);
        setFallbackProductName(product?.name ?? null);
      }
    }

    void loadRelated();
  }, [fallbackListingTitle, fallbackProductName, order, readController]);
  if (order === undefined) {
    return null;
  }

  if (!order || (activeUser && order.investorId !== activeUser.uid)) {
    return null;
  }

  const resolvedOrder = order;
  const listingTitle =
    initialListingWithAsset?.listing.title ??
    fallbackListingTitle ??
    resolvedOrder.listingId;
  const productName =
    initialProductName ?? fallbackProductName ?? resolvedOrder.productId;
  const statusColor =
    resolvedOrder.status === "paid" ? "success" : "warning";

  return (
    <div className="vertical-stack-with-gap">
      <KeyValueList
        items={[
          { label: "Order", value: orderId },
          {
            label: "Status",
            value: <Badge color={statusColor}>{resolvedOrder.status}</Badge>,
          },
          { label: "Created", value: "—" },
          { label: "Listing", value: listingTitle },
          {
            label: "Product",
            value: `${productName} (${resolvedOrder.currency} ${resolvedOrder.effectiveUnitPrice ?? resolvedOrder.unitPrice})`,
          },
          ...(resolvedOrder.coupon
            ? [{ label: "Coupon", value: resolvedOrder.coupon }]
            : []),
          { label: "Quantity", value: resolvedOrder.quantity },
          {
            label: "Total",
            value: `${resolvedOrder.currency} ${resolvedOrder.total}`,
          },
          ...(resolvedOrder.notes
            ? [{ label: "Notes", value: resolvedOrder.notes }]
            : []),
          {
            label: "Payment",
            value: resolvedOrder.paymentProvider ?? "card",
          },
        ]}
      />
    </div>
  );
}
