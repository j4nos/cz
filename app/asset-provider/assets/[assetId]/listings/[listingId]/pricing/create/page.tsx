import { notFound } from "next/navigation";
import { Pricing } from "../Pricing";

type Props = {
  params: { assetId: string; listingId: string };
};

export default function PricingCreatePage({ params }: Props) {
  if (!params?.assetId || !params?.listingId) {
    notFound();
  }

  return (
    <Pricing
      assetId={params.assetId}
      listingId={params.listingId}
      mode="create"
    />
  );
}
