"use client";

import { useEffect, useState } from "react";

import { AppLink } from "@/components/ui/AppLink";
import { Badge } from "@/components/ui/Badge";
import { Table } from "@/components/ui/Table";
import { useAuth } from "@/contexts/AuthContext";
import type { Order, Product } from "@/src/domain/entities";
import { createReadController } from "@/src/infrastructure/controllers/createReadController";

export default function InvestorOrdersPage() {
  const { activeUser, loading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [productsById, setProductsById] = useState<Record<string, Product>>({});

  useEffect(() => {
    async function load() {
      if (!activeUser) {
        setOrders([]);
        setProductsById({});
        return;
      }

      const controller = createReadController();
      const nextOrders = await controller.listOrdersByInvestor(activeUser.uid);
      const productEntries = await Promise.all(
        Array.from(new Set(nextOrders.map((order) => order.productId))).map(
          async (productId) => [productId, await controller.getProductById(productId)] as const,
        ),
      );

      setOrders(nextOrders);
      setProductsById(
        Object.fromEntries(productEntries.filter((entry): entry is [string, Product] => Boolean(entry[1]))),
      );
    }

    void load();
  }, [activeUser]);

  if (loading) {
    return null;
  }

  if (!activeUser) {
    return <p className="muted">Login to see your orders.</p>;
  }

  return (
    <div className="vertical-stack-with-gap">
      <header>
        <h1>Your Orders</h1>
      </header>
      <Table>
        <thead>
          <tr>
            <th>Order</th>
            <th>Product</th>
            <th>Qty</th>
            <th>Total</th>
            <th>Created</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => {
            const product = productsById[order.productId];
            return (
              <tr key={order.id}>
                <td>
                  <AppLink href={`/investor/orders/${order.id}`}>
                    {order.id}
                  </AppLink>
                </td>
                <td>{product?.name ?? order.productId}</td>
                <td>{order.quantity}</td>
                <td>
                  {order.currency} {order.total}
                  {order.coupon ? ` (${order.coupon})` : ""}
                </td>
                <td className="muted">—</td>
                <td>
                  <Badge
                    color={
                      order.status === "paid" ? "success" : "warning"
                    }
                  >
                    {order.status}
                  </Badge>
                </td>
              </tr>
            );
          })}
          {orders.length === 0 ? (
            <tr>
              <td colSpan={6}>No orders yet.</td>
            </tr>
          ) : null}
        </tbody>
      </Table>
    </div>
  );
}
