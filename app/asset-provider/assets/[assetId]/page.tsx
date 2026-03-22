import { notFound } from "next/navigation";
import { AssetProviderAsset } from "./AssetProviderAsset";

type Props = {
  params: { assetId: string };
};

export default function AssetProviderAssetPage({ params }: Props) {
  if (!params?.assetId) {
    notFound();
  }

  return <AssetProviderAsset assetId={params.assetId} />;
}
