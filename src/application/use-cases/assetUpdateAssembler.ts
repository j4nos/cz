import type { Asset } from "@/src/domain/entities";

export function buildUpdatedAssetBasics(input: {
  asset: Asset;
  name: string;
  country: string;
  assetClass: string;
  beneficiaryIban: string;
  beneficiaryLabel: string;
}): Asset {
  return {
    ...input.asset,
    name: input.name,
    country: input.country,
    assetClass: input.assetClass,
    beneficiaryIban: input.beneficiaryIban || undefined,
    beneficiaryLabel: input.beneficiaryLabel || undefined,
  };
}
