import { Listing } from "@/components/listing";
import { createPublicContentReader } from "@/src/infrastructure/repositories/createPublicContentReader";
import { notFound } from "next/navigation";

export const dynamicParams = true;

export default async function ListingPage({ params }: { params: { listingId: string } }) {
  if (!params?.listingId) {
    notFound();
  }

  const reader = createPublicContentReader();
  const [listingWithAsset, products] = await Promise.all([
    reader.getListingWithAssetById(params.listingId),
    reader.listProductsByListingId(params.listingId),
  ]);

  if (!listingWithAsset) {
    notFound();
  }

  return <Listing initialListingWithAsset={listingWithAsset} initialProducts={products} />;
}
