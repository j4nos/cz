import { CreateEditListingClient } from "@/components/asset-provider/CreateEditListingClient";

export function CreateEditListing({ assetId, listingId }: { assetId: string; listingId?: string }) {
  return <CreateEditListingClient assetId={assetId} listingId={listingId} />;
}
