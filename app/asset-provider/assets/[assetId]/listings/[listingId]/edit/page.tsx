import { CreateEditListing } from "@/components/CreateEditListing";

export default function AssetEditListingPage({ params }: { params: { assetId: string; listingId: string } }) {
  return <CreateEditListing assetId={params.assetId} listingId={params.listingId} />;
}
