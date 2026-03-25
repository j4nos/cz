import {
  buildAssetAfterContractDeployment,
  getDesiredContractStandard,
} from "@/src/application/use-cases/contractDeploymentRules";
import type { Asset } from "@/src/domain/entities";
import { DomainError } from "@/src/domain/value-objects/errors";

type SubmitAssetRepository = {
  getAssetById(id: string): Promise<Asset | null>;
  updateAsset(asset: Asset): Promise<Asset>;
};

type TokenizeAssetResult = {
  address: string;
};

type TokenizeAsset = (input: {
  assetId: string;
  userId: string;
  name: string;
  tokenStandard: string;
}) => Promise<TokenizeAssetResult>;

export class SubmitAssetService {
  constructor(
    private readonly repository: SubmitAssetRepository,
    private readonly tokenizeAsset: TokenizeAsset,
  ) {}

  async submit(input: {
    assetId: string;
    userId: string;
    name: string;
    country: string;
    assetClass: string;
    tokenStandard: string;
  }): Promise<Asset> {
    const asset = await this.repository.getAssetById(input.assetId);
    if (!asset) {
      throw new DomainError({ code: "ASSET_NOT_FOUND" });
    }

    if (asset.tenantUserId !== input.userId) {
      throw new DomainError({ code: "FORBIDDEN" });
    }

    const desiredStandard = getDesiredContractStandard({
      wizardTokenStandard: input.tokenStandard,
      assetTokenStandard: asset.tokenStandard,
    });

    let tokenAddress = asset.tokenAddress;
    if (!tokenAddress) {
      const tokenization = await this.tokenizeAsset({
        assetId: input.assetId,
        userId: input.userId,
        name: input.name,
        tokenStandard: desiredStandard,
      });
      tokenAddress = tokenization.address;
    }

    return this.repository.updateAsset(
      buildAssetAfterContractDeployment({
        existingAsset: asset,
        assetId: input.assetId,
        userId: input.userId,
        name: input.name,
        country: input.country,
        assetClass: input.assetClass,
        tokenStandard: desiredStandard,
        tokenAddress,
      }),
    );
  }
}
