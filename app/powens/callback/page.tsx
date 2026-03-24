"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { AppLink } from "@/components/ui/AppLink";
import { Badge } from "@/components/ui/Badge";
import { KeyValueList } from "@/components/ui/KeyValueList";
import { useAuth } from "@/contexts/AuthContext";
import { useLoading } from "@/contexts/LoadingContext";
import type { Order } from "@/src/domain/entities";
import { createReadController } from "@/src/infrastructure/controllers/createReadController";

export default function PowensReturnPage() {
  return (
    <Suspense fallback={null}>
      <PowensReturnContent />
    </Suspense>
  );
}

function getStatusBadgeColor(value: string) {
  const normalized = value.toLowerCase();
  if (["done", "paid", "success", "completed"].includes(normalized)) {
    return "success";
  }
  if (["failed", "error", "canceled", "cancelled", "rejected"].includes(normalized)) {
    return "danger";
  }
  if (["pending", "processing", "in_progress", "created", "validating"].includes(normalized)) {
    return "warning";
  }
  return "neutral";
}

function PowensReturnContent() {
  const params = useSearchParams();
  const { accessToken } = useAuth();
  const { setLoading } = useLoading();
  const [order, setOrder] = useState<Order | null>(null);

  const orderId = params.get("state") || "";
  const paymentState = params.get("payment_state") || "";
  const paymentId = params.get("id_payment") || "";
  const error = params.get("error");

  useEffect(() => {
    let active = true;

    async function loadOrder() {
      if (!orderId) {
        return;
      }

      setLoading("powens-order", true);
      try {
        const next = await createReadController().getOrderById(orderId);
        if (active) {
          setOrder(next);
        }
      } finally {
        setLoading("powens-order", false);
      }
    }

    void loadOrder();

    return () => {
      active = false;
    };
  }, [orderId, setLoading]);

  useEffect(() => {
    let active = true;

    async function refreshPaymentStatus() {
      if (!orderId || !accessToken) {
        return;
      }

      setLoading("powens-status", true);
      try {
        await fetch("/api/powens/payment-status", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ orderId }),
        });
        if (!active) {
          return;
        }
        const next = await createReadController().getOrderById(orderId);
        if (active) {
          setOrder(next);
        }
      } catch {
        // Ignore transient polling errors.
      } finally {
        setLoading("powens-status", false);
      }
    }

    void refreshPaymentStatus();

    return () => {
      active = false;
    };
  }, [accessToken, orderId, setLoading]);

  const effectivePaymentStatus = paymentState || order?.paymentProviderStatus || "—";
  const orderStatus = order?.status || "—";

  return (
    <div className="vertical-stack-with-gap">
      <header>
        <h1>Bank transfer</h1>
        <p className="muted">
          {error
            ? "We could not complete the bank transfer."
            : "Your bank transfer is being confirmed."}
        </p>
      </header>
      <section>
        <KeyValueList
          className="muted"
          items={[
            { label: "Order", value: orderId || "—" },
            { label: "Payment", value: paymentId || "—" },
            {
              label: "Payment state",
              value:
                effectivePaymentStatus === "—" ? (
                  "—"
                ) : (
                  <Badge color={getStatusBadgeColor(effectivePaymentStatus)}>
                    {effectivePaymentStatus}
                  </Badge>
                ),
            },
            {
              label: "Order status",
              value:
                orderStatus === "—" ? (
                  "—"
                ) : (
                  <Badge color={getStatusBadgeColor(orderStatus)}>
                    {orderStatus}
                  </Badge>
                ),
            },
          ]}
        />
      </section>
      {orderId ? (
        <AppLink href={`/investor/orders/${orderId}`}>View order details</AppLink>
      ) : null}
    </div>
  );
}
