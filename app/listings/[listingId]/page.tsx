import { Listing } from "@/components/listing";
import {
  listPublicListings,
} from "@/src/application/publicContent";
import { createPublicContentReader } from "@/src/infrastructure/repositories/createPublicContentReader";
import { notFound } from "next/navigation";

export const dynamicParams = true;
export const revalidate = 3600;

export async function generateStaticParams() {
  const listings = await listPublicListings(createPublicContentReader());
  return listings.map((entry) => ({ listingId: entry.listing.id }));
}

export default async function ListingPage({ params }: { params: { listingId: string } }) {
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
