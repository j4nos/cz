import { notFound } from "next/navigation";
import { Pricing } from "../../Pricing";

type Props = {
  params: { assetId: string; listingId: string; productId: string };
};

export default function PricingProductPage({ params }: Props) {
  if (!params?.assetId || !params?.listingId || !params?.productId) {
    notFound();
  }

  return (
    <Pricing
      assetId={params.assetId}
      listingId={params.listingId}
      preselectedProductId={params.productId}
      mode="edit"
    />
  );
}
