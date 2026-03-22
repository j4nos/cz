import { notFound } from "next/navigation";

import { getPublicListingDetails } from "@/src/application/use-cases/publicContent";
import { createPublicContentReader } from "@/src/infrastructure/repositories/createPublicContentReader";
import { InvestorListing } from "./InvestorListing";

export default async function InvestorListingPage({ params }: { params: { listingId: string } }) {
  if (!params?.listingId) {
    notFound();
  }

  const { listingWithAsset, products } = await getPublicListingDetails(createPublicContentReader(), params.listingId);

  if (!listingWithAsset) {
    notFound();
  }

  return (
    <InvestorListing
      listingId={params.listingId}
      initialListingWithAsset={listingWithAsset}
      initialProducts={products}
    />
  );
}
