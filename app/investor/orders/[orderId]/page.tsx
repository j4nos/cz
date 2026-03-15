import { notFound } from "next/navigation";

import { getInvestorOrderEntry } from "@/src/application/use-cases/publicContent";
import { createPublicContentReader } from "@/src/infrastructure/repositories/createPublicContentReader";
import { InvestorOrder } from "./InvestorOrder";

export default async function InvestorOrderDetailsPage({ params }: { params: { orderId: string } }) {
  const { order, listingWithAsset, product } = await getInvestorOrderEntry(createPublicContentReader(), params.orderId);

  if (!order) {
    notFound();
  }

  return (
    <InvestorOrder
      orderId={params.orderId}
      initialListingWithAsset={listingWithAsset}
      initialOrder={order}
      initialProductName={product?.name ?? null}
    />
  );
}
