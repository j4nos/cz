import { PricingPageClient } from "@/components/asset-provider/PricingPageClient";

export default function PricingPage({ params }: { params: { assetId: string; listingId: string } }) {
  return <PricingPageClient assetId={params.assetId} listingId={params.listingId} />;
}
