"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Table } from "@/components/ui/Table";
import { OwnershipMintingService } from "@/src/application/use-cases/ownershipMintingService";
import { usePrivateAuth } from "@/contexts/AuthContext";
import { useLoading } from "@/contexts/LoadingContext";
import type { Order, Product } from "@/src/domain/entities";
import { createOrderController } from "@/src/infrastructure/controllers/createOrderController";
import { createReadController } from "@/src/infrastructure/controllers/createReadController";

export default function AssetProviderOrdersPage() {
  const { user, loading, accessToken } = usePrivateAuth();
  const { setLoading } = useLoading();
  const readController = useMemo(() => createReadController(), []);
  const orderController = useMemo(() => createOrderController(), []);
  const ownershipMintingService = useMemo(
    () =>
      new OwnershipMintingService(
        readController,
        async ({ accessToken: currentAccessToken, body }) => {
          const response = await fetch("/api/mint-ownership", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${currentAccessToken}`,
            },
            body: JSON.stringify(body),
          });
          const result = await response.json().catch(() => ({}));
          if (!response.ok) {
            throw new Error(result?.error || "Mint API error");
          }
          return result;
        },
      ),
    [readController],
  );
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
        const next = await readController.listOrdersByProvider(user.uid);
        next.sort(
          (a, b) =>
            new Date(b.createdAt ?? 0).getTime() -
            new Date(a.createdAt ?? 0).getTime()
        );
        setOrders(next);

        const uniqueProductIds = Array.from(
          new Set(next.map((order) => order.productId))
        );
        const productEntries = await Promise.all(
          uniqueProductIds.map(
            async (productId) =>
              [productId, await readController.getProductById(productId)] as const
          )
        );
        setProductsById(
          Object.fromEntries(
            productEntries.filter(
              (entry): entry is [string, Product] => Boolean(entry[1])
            )
          )
        );
      } finally {
        setLoading("asset-provider-orders", false);
      }
    }
    void load();
  }, [readController, setLoading, user.uid]);

  async function handleMarkPaid(orderId: string) {
    setUpdatingId(orderId);
    try {
      const currentOrder = await readController.getOrderById(orderId);
      if (!currentOrder) {
        return;
      }

      const paidOrder = await orderController.completeOrder(currentOrder.id);

      const updatedOrders = orders.map((item) =>
        item.id === orderId ? paidOrder : item
      );
      setOrders(updatedOrders);

      const nextPaidOrder = updatedOrders.find((item) => item.id === orderId);
      if (nextPaidOrder) {
        await mintOwnershipIfPossible(nextPaidOrder);
      }
    } finally {
      setUpdatingId(null);
    }
  }

  async function mintOwnershipIfPossible(order: Order) {
    const result = await ownershipMintingService.mint({
      order,
      accessToken,
    });
    if (result.kind === "success" && result.result.mintedAt) {
      setOrders((current) =>
        current.map((item) =>
          item.id === order.id
            ? {
                ...item,
                mintRequestedAt: result.result.mintRequestedAt ?? item.mintRequestedAt,
                mintedAt: result.result.mintedAt ?? item.mintedAt,
              }
            : item,
        ),
      );
    } else if (result.kind === "success" && result.result.mintRequestedAt) {
      setOrders((current) =>
        current.map((item) =>
          item.id === order.id
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
