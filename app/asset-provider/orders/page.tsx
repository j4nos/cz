"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Table } from "@/components/ui/Table";
import { useAuth } from "@/contexts/AuthContext";
import { useLoading } from "@/contexts/LoadingContext";
import type { Order, Product } from "@/src/domain/entities";
import { createReadController } from "@/src/infrastructure/controllers/createReadController";

export default function AssetProviderOrdersPage() {
  const { user, loading, accessToken } = useAuth();
  const { setLoading } = useLoading();
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
      if (!user) {
        setOrders([]);
        setProductsById({});
        setLoading("asset-provider-orders", false);
        return;
      }
      try {
        const controller = createReadController();
        const next = await controller.listOrdersByProvider(user.uid);
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
              [productId, await controller.getProductById(productId)] as const
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
  }, [user, setLoading]);

  async function handleMarkPaid(orderId: string) {
    if (!user) {
      return;
    }
    setUpdatingId(orderId);
    try {
      const controller = createReadController();
      const currentOrder = await controller.getOrderById(orderId);
      if (!currentOrder) {
        return;
      }

      const paidOrder = {
        ...currentOrder,
        status: "paid" as const,
      };
      await controller.updateOrder(paidOrder);

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
    if (!order.investorWalletAddress) {
      return;
    }
    const controller = createReadController();
    const listing = await controller.getListingById(order.listingId);
    if (!listing) return;
    const asset = await controller.getAssetById(listing.assetId);
    if (!asset?.tokenAddress) return;

    if (!accessToken) {
      return;
    }

    await fetch("/api/mint-ownership", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        tokenAddress: asset.tokenAddress,
        to: order.investorWalletAddress,
        amount: order.quantity,
        orderId: order.id,
        tokenStandard: asset.tokenStandard ?? "erc-20",
      }),
    });
  }

  if (loading) {
    return null;
  }

  if (!user) {
    return <p className="muted">Login to view provider orders.</p>;
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
