import { CreateEditListing } from "@/components/create-edit-listing";

export default function AssetCreateListingPage({ params }: { params: { assetId: string } }) {
  return <CreateEditListing assetId={params.assetId} />;
}
