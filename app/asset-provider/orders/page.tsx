"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Table } from "@/components/ui/Table";
import { usePrivateAuth } from "@/contexts/AuthContext";
import { useLoading } from "@/contexts/LoadingContext";
import type { Order, Product } from "@/src/domain/entities";
import { createAssetProviderOrdersFacade } from "@/src/presentation/composition/client";

export default function AssetProviderOrdersPage() {
  const { user, loading, accessToken } = usePrivateAuth();
  const { setLoading } = useLoading();
  const ordersFacade = useMemo(() => createAssetProviderOrdersFacade(), []);
  const [orders, setOrders] = useState<Order[]>([]);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [productsById, setProductsById] = useState<Record<string, Product>>({});

  function formatDate(value?: string) {
    if (!value) return "–";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "–";
    return date.toLocaleString();
  }

  useEffect(() => {
    async function load() {
      setLoading("asset-provider-orders", true);
      try {
        const next = await ordersFacade.listOrdersByProvider(user.uid);
        setOrders(next.orders);
        setProductsById(next.productsById);
      } finally {
        setLoading("asset-provider-orders", false);
      }
    }
    void load();
  }, [ordersFacade, setLoading, user.uid]);

  async function handleMarkPaid(orderId: string) {
    setUpdatingId(orderId);
    try {
      const { paidOrder, mintResult } = await ordersFacade.completePaymentAndMint({
        orderId,
        accessToken,
      });
      if (!paidOrder) {
        return;
      }

      const updatedOrders = orders.map((item) =>
        item.id === orderId ? paidOrder : item
      );
      setOrders(updatedOrders);

      applyMintResult(orderId, mintResult);
    } finally {
      setUpdatingId(null);
    }
  }

  function applyMintResult(orderId: string, result: Awaited<ReturnType<ReturnType<typeof createAssetProviderOrdersFacade>["completePaymentAndMint"]>>["mintResult"]) {
    if (!result || result.kind !== "success") {
      return;
    }

    if (result.result.mintedAt) {
      setOrders((current) =>
        current.map((item) =>
          item.id === orderId
            ? {
                ...item,
                mintRequestedAt: result.result.mintRequestedAt ?? item.mintRequestedAt,
                mintedAt: result.result.mintedAt ?? item.mintedAt,
              }
            : item,
        ),
      );
    } else if (result.result.mintRequestedAt) {
      setOrders((current) =>
        current.map((item) =>
          item.id === orderId
            ? {
                ...item,
                mintRequestedAt: result.result.mintRequestedAt ?? item.mintRequestedAt,
              }
            : item,
        ),
      );
    }
  }

  if (loading) {
    return null;
  }

  return (
    <div className="vertical-stack-with-gap">
      <header>
        <h1>Provider Orders</h1>
      </header>
      <Table>
        <thead>
          <tr>
            <th>Order</th>
            <th>Product</th>
            <th>Quantity</th>
            <th>Total</th>
            <th>Created</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td>{order.id}</td>
              <td>{productsById[order.productId]?.name ?? order.productId}</td>
              <td>{order.quantity}</td>
              <td>
                {order.currency} {order.total}
                {order.coupon ? ` (${order.coupon})` : ""}
              </td>
              <td className="muted">{formatDate(order.createdAt)}</td>
              <td>
                <Badge
                  color={
                    order.status === "paid" ? "success" : "warning"
                  }
                >
                  {order.status}
                </Badge>
              </td>
              <td>
                {order.status === "paid" ? null : (
                  <Button
                    onClick={() => void handleMarkPaid(order.id)}
                    disabled={updatingId === order.id}
                  >
                    {updatingId === order.id ? "Marking..." : "Mark paid"}
                  </Button>
                )}
              </td>
            </tr>
          ))}
          {orders.length === 0 ? (
            <tr>
              <td colSpan={7}>No orders.</td>
            </tr>
          ) : null}
        </tbody>
      </Table>
    </div>
  );
}
