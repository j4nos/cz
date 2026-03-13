import { PricingEditor } from "@/components/PricingEditor";

type Props = {
  assetId: string;
  listingId: string;
  mode: "edit" | "create";
  preselectedProductId?: string;
};

export function Pricing({
  assetId,
  listingId,
  mode,
  preselectedProductId,
}: Props) {
  return (
    <PricingEditor
      assetId={assetId}
      listingId={listingId}
      mode={mode}
      preselectedProductId={preselectedProductId}
    />
  );
}
