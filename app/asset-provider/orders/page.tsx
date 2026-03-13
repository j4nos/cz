import { getOrdersForProvider } from "@/src/ui/queries";

export default function AssetProviderOrdersPage() {
  const orders = getOrdersForProvider("provider-1");

  return (
    <section>
      <h1>Provider orders</h1>
      <table>
        <thead>
          <tr>
            <th>Order</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td>{order.id}</td>
              <td>{order.status}</td>
              <td>
                <button type="button">Mark paid</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
