import { notFound } from "next/navigation";
import { CreateEditListing } from "@/components/CreateEditListing";

export default function AssetCreateListingPage({ params }: { params: { assetId: string } }) {
  if (!params?.assetId) {
    notFound();
  }

  return <CreateEditListing assetId={params.assetId} />;
}
