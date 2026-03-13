import { Pricing } from "./Pricing";

export default function PricingPage({ params }: { params: { assetId: string; listingId: string } }) {
  return (
    <Pricing
      assetId={params.assetId}
      listingId={params.listingId}
      mode="edit"
    />
  );
}
