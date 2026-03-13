import { CreateEditListing } from "@/components/CreateEditListing";

export default function AssetCreateListingPage({ params }: { params: { assetId: string } }) {
  return <CreateEditListing assetId={params.assetId} />;
}
