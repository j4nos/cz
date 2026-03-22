import { notFound } from "next/navigation";
import { Pricing } from "./Pricing";

export default function PricingPage({ params }: { params: { assetId: string; listingId: string } }) {
  if (!params?.assetId || !params?.listingId) {
    notFound();
  }

  return (
    <Pricing
      assetId={params.assetId}
      listingId={params.listingId}
      mode="edit"
    />
  );
}
