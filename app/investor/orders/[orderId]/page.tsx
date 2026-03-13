import Link from "next/link";
import { redirect } from "next/navigation";

import { buildOrderSummary } from "@/src/ui/queries";

export default function InvestorOrderDetailsPage({
  params,
  searchParams,
}: {
  params: { orderId: string };
  searchParams: { listingId?: string; productId?: string; quantity?: string; status?: string };
}) {
  const listingId = searchParams.listingId;
  const productId = searchParams.productId;

  if (!listingId || !productId) {
    redirect("/investor/orders");
  }

  const summary = buildOrderSummary({
    listingId,
    productId,
    quantity: Number(searchParams.quantity ?? "1"),
    status: searchParams.status === "COMPLETED" ? "COMPLETED" : "PENDING_PAYMENT",
  });

  if (!summary) {
    redirect("/investor/orders");
  }

  return (
    <section>
      <h1>Order {params.orderId}</h1>
      <p>Status: {summary.status}</p>
      <p>Listing: {summary.listing.title}</p>
      <p>Product: {summary.product.name}</p>
      <p>Quantity: {summary.quantity}</p>
      <p>
        Total: {summary.total} {summary.product.currency}
      </p>
      {summary.status === "PENDING_PAYMENT" ? (
        <p>
          <Link
            href={`/investor/orders/${params.orderId}?listingId=${summary.listing.id}&productId=${summary.product.id}&quantity=${summary.quantity}&status=COMPLETED`}
          >
            Complete payment in fake provider
          </Link>
        </p>
      ) : (
        <p>Payment confirmed by fake provider.</p>
      )}
    </section>
  );
}
