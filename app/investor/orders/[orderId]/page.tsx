import { notFound } from "next/navigation";

import { InvestorOrder } from "./InvestorOrder";

export default async function InvestorOrderDetailsPage({ params }: { params: { orderId: string } }) {
  if (!params?.orderId) {
    notFound();
  }

  return <InvestorOrder orderId={params.orderId} />;
}
