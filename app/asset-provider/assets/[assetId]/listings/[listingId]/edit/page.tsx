import { notFound } from "next/navigation";
import { CreateEditListing } from "@/components/CreateEditListing";

export default function AssetEditListingPage({ params }: { params: { assetId: string; listingId: string } }) {
  if (!params?.assetId || !params?.listingId) {
    notFound();
  }

  return <CreateEditListing assetId={params.assetId} listingId={params.listingId} />;
}
