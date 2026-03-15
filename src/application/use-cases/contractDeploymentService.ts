import {
  buildAssetAfterContractDeployment,
  buildContractDeploymentRequest,
  getContractDeploymentError,
  getDesiredContractStandard,
  shouldDeployContract,
} from "@/src/application/use-cases/contractDeploymentRules";
import type { Asset } from "@/src/domain/entities";

type DeployResponse = { address: string };

export class ContractDeploymentService {
  constructor(
    private readonly repository: {
      getAssetById(id: string): Promise<Asset | null>;
      updateAsset(asset: Asset): Promise<Asset>;
    },
    private readonly deployContract: (input: {
      assetId: string;
      userId: string;
      name: string;
      tokenStandard: string;
      accessToken: string;
    }) => Promise<DeployResponse>,
  ) {}

  async loadAssetReview(assetId: string, wizardTokenStandard?: string) {
    const asset = await this.repository.getAssetById(assetId);
    return {
      asset,
      wizardPatch: asset
        ? {
            assetId: asset.id,
            name: asset.name,
            country: asset.country,
            assetClass: asset.assetClass,
            tokenStandard: asset.tokenStandard ?? wizardTokenStandard ?? "ERC-20",
          }
        : null,
    };
  }

  async submit(input: {
    assetId?: string;
    activeUserId?: string;
    accessToken?: string | null;
    wizardState: {
      name: string;
      country: string;
      assetClass: string;
      tokenStandard: string;
    };
    asset: Asset | null;
  }): Promise<
    | { kind: "error"; message: string; tone: "warning" | "danger" }
    | { kind: "success"; asset: Asset; message: string }
  > {
    const name = input.asset?.name || input.wizardState.name;
    const country = input.asset?.country || input.wizardState.country;
    const assetClass = input.asset?.assetClass || input.wizardState.assetClass;
    const error = getContractDeploymentError({
      assetId: input.assetId,
      userId: input.activeUserId,
      name,
      country,
      assetClass,
    });
    if (error) {
      return {
        kind: "error",
        message: error,
        tone: error === "Missing asset details. Complete previous steps." ? "warning" : "danger",
      };
    }

    const desiredStandard = getDesiredContractStandard({
      wizardTokenStandard: input.wizardState.tokenStandard,
      assetTokenStandard: input.asset?.tokenStandard,
    });

    let tokenAddress = input.asset?.tokenAddress;
    if (shouldDeployContract(input.asset)) {
      if (!input.accessToken) {
        return {
          kind: "error",
          message: "Login required to deploy contract.",
          tone: "danger",
        };
      }
      const deployed = await this.deployContract({
        assetId: input.assetId!,
        userId: input.activeUserId!,
        name,
        tokenStandard: desiredStandard,
        accessToken: input.accessToken,
      });
      tokenAddress = deployed.address;
    }

    const savedAsset = await this.repository.updateAsset(
      buildAssetAfterContractDeployment({
        existingAsset: input.asset,
        assetId: input.assetId!,
        userId: input.activeUserId!,
        name,
        country,
        assetClass,
        tokenStandard: desiredStandard,
        tokenAddress,
      }),
    );

    return {
      kind: "success",
      asset: savedAsset,
      message: "Asset submitted with contract.",
    };
  }

  buildDeploymentPayload(input: {
    assetId: string;
    userId: string;
    name: string;
    tokenStandard: string;
  }) {
    return buildContractDeploymentRequest(input);
  }
}
