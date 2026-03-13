import { AssetProviderAssetsPageClient } from "@/components/asset-provider/AssetProviderAssetsPageClient";

export default function AssetProviderAssetsPage({
  searchParams,
}: {
  searchParams: { created?: string };
}) {
  return <AssetProviderAssetsPageClient createdAssetId={searchParams.created} />;
}
