import type { Asset } from "@/src/domain/entities";

export type ContractDeploymentDraft = {
  assetId: string;
  userId: string;
  name: string;
  country: string;
  assetClass: string;
  tokenStandard: string;
  tokenAddress?: string;
  existingAsset?: Asset | null;
};

export function getContractDeploymentError(input: {
  assetId?: string;
  userId?: string;
  name?: string;
  country?: string;
  assetClass?: string;
}): string | undefined {
  if (!input.assetId) {
    return "Missing assetId. Complete earlier steps first.";
  }

  if (!input.userId) {
    return "Login required.";
  }

  if (!input.name || !input.country || !input.assetClass) {
    return "Missing asset details. Complete previous steps.";
  }

  return undefined;
}

export function getDesiredContractStandard(input: {
  wizardTokenStandard?: string;
  assetTokenStandard?: string;
}): string {
  return input.wizardTokenStandard || input.assetTokenStandard || "ERC-20";
}

export function buildContractSymbol(name: string): string {
  return name.replace(/\W+/g, "").toUpperCase().slice(0, 6) || "ASSET";
}

export function shouldDeployContract(asset: Pick<Asset, "tokenAddress"> | null): boolean {
  return !asset?.tokenAddress;
}

export function buildContractDeploymentRequest(input: {
  assetId: string;
  userId: string;
  name: string;
  tokenStandard: string;
}) {
  return {
    assetId: input.assetId,
    userId: input.userId,
    name: input.name,
    symbol: buildContractSymbol(input.name),
    tokenStandard: input.tokenStandard,
  };
}

export function buildAssetAfterContractDeployment(input: ContractDeploymentDraft): Asset {
  const { existingAsset, assetId, userId, name, country, assetClass, tokenStandard, tokenAddress } = input;

  const baseAsset: Asset = existingAsset
    ? {
        ...existingAsset,
        name,
        country,
        assetClass,
        tokenStandard,
        missingDocsCount: existingAsset.missingDocsCount ?? 0,
      }
    : {
        id: assetId,
        tenantUserId: userId,
        name,
        country,
        assetClass,
        tokenStandard,
        status: "draft",
        missingDocsCount: 0,
        imageUrls: [],
      };

  return {
    ...baseAsset,
    tokenAddress,
    status: "submitted",
  };
}
