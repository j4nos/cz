"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { KeyValueList } from "@/components/ui/KeyValueList";
import { useAuth } from "@/contexts/AuthContext";
import type { PublicListingWithAsset } from "@/src/application/publicContent";
import type { Order } from "@/src/domain/entities";
import { createReadController } from "@/src/infrastructure/controllers/createReadController";

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
  const params = useParams<{ orderId: string }>();
  const { activeUser } = useAuth();
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
      const controller = createReadController();
      const orders = activeUser
        ? await controller.listOrdersByInvestor(activeUser.uid)
        : [];
      const next = orders.find((item) => item.id === params.orderId) ?? null;
      setOrder(next);
    }

    void load();
  }, [activeUser, initialOrder, params.orderId]);

  useEffect(() => {
    async function loadRelated() {
      if (!order) {
        return;
      }

      const controller = createReadController();
      if (!fallbackListingTitle) {
        const listing = await controller.getListingById(order.listingId);
        setFallbackListingTitle(listing?.title ?? null);
      }
      if (!fallbackProductName) {
        const product = await controller.getProductById(order.productId);
        setFallbackProductName(product?.name ?? null);
      }
    }

    void loadRelated();
  }, [fallbackListingTitle, fallbackProductName, order]);

  if (order === undefined) {
    return <p className="muted">Loading order...</p>;
  }

  if (!order || (activeUser && order.investorId !== activeUser.uid)) {
    return (
      <section className="vertical-stack-with-gap">
        <h1>Order not found</h1>
        <p className="muted">
          The selected order is not available for the current user.
        </p>
      </section>
    );
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
            value: `${productName} (${resolvedOrder.currency} ${resolvedOrder.unitPrice})`,
          },
          { label: "Quantity", value: resolvedOrder.quantity },
          {
            label: "Total",
            value: `${resolvedOrder.currency} ${resolvedOrder.total}`,
          },
          {
            label: "Payment",
            value: resolvedOrder.paymentProvider ?? "card",
          },
        ]}
      />
    </div>
  );
}
