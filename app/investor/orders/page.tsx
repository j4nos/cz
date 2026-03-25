"use client";

import { useEffect, useMemo, useState } from "react";

import { AppLink } from "@/components/ui/AppLink";
import { Badge } from "@/components/ui/Badge";
import { Table } from "@/components/ui/Table";
import { usePrivateAuth } from "@/contexts/AuthContext";
import type { Order, Product } from "@/src/domain/entities";
import { createReadPort } from "@/src/presentation/composition/client";

export default function InvestorOrdersPage() {
  const { user, loading } = usePrivateAuth();
  const readController = useMemo(() => createReadPort(), []);
  const [orders, setOrders] = useState<Order[]>([]);
  const [productsById, setProductsById] = useState<Record<string, Product>>({});

  useEffect(() => {
    async function load() {
      const nextOrders = await readController.listOrdersByInvestor(user.uid);
      const productEntries = await Promise.all(
        Array.from(new Set(nextOrders.map((order) => order.productId))).map(
          async (productId) => [productId, await readController.getProductById(productId)] as const,
        ),
      );

      setOrders(nextOrders);
      setProductsById(
        Object.fromEntries(productEntries.filter((entry): entry is [string, Product] => Boolean(entry[1]))),
      );
    }

    void load();
  }, [readController, user.uid]);

  if (loading) {
    return null;
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
