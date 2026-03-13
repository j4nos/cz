import Link from "next/link";

import { getOrdersForInvestor, getProductById } from "@/src/ui/queries";

export default function InvestorOrdersPage() {
  const orders = getOrdersForInvestor("investor-1");

  return (
    <section>
      <h1>Investor orders</h1>
      <table>
        <thead>
          <tr>
            <th>Order</th>
            <th>Product</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td>
                <Link href={`/investor/orders/${order.id}?listingId=${order.listingId}&productId=${order.productId}&quantity=${order.quantity}&status=${order.status}`}>
                  {order.id}
                </Link>
              </td>
              <td>{getProductById(order.productId)?.name}</td>
              <td>{order.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
