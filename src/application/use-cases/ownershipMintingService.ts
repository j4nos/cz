import {
  buildMintOwnershipRequest,
  getMintOwnershipError,
  getMintOwnershipSuccessMessage,
} from "@/src/application/use-cases/ownershipMinting";
import type { Asset, Listing, Order } from "@/src/domain/entities";

type OwnershipMintingReadRepository = {
  getAssetById: (assetId: string) => Promise<Asset | null>;
  getListingById: (listingId: string) => Promise<Listing | null>;
};

type MintResult = {
  status?: string;
  txHash?: string;
  mintRequestedAt?: string;
  mintedAt?: string;
  error?: string;
};

export class OwnershipMintingService {
  constructor(
    private readonly repository: OwnershipMintingReadRepository,
    private readonly requestMint: (input: {
      accessToken: string;
      body: object;
    }) => Promise<MintResult>,
  ) {}

  async resolveContext(order: Order, knownTokenAddress?: string): Promise<{
    listing: Listing | null;
    asset: Asset | null;
    tokenAddress: string;
  }> {
    const listing = await this.repository.getListingById(order.listingId);
    const asset = listing ? await this.repository.getAssetById(listing.assetId) : null;
    return {
      listing,
      asset,
      tokenAddress: knownTokenAddress || asset?.tokenAddress || "",
    };
  }

  async mint(input: {
    order: Order | null;
    walletAddress?: string;
    accessToken?: string | null;
    knownTokenAddress?: string;
  }): Promise<
    | { kind: "error"; message: string }
    | {
        kind: "success";
        result: MintResult;
        toast: { message: string; tone: "success" | "warning" };
        listing: Listing | null;
        asset: Asset | null;
        tokenAddress: string;
      }
  > {
    if (!input.order) {
      return { kind: "error", message: "Order not found." };
    }

    const resolved = await this.resolveContext(input.order, input.knownTokenAddress);
    const effectiveAsset = resolved.asset
      ? { ...resolved.asset, tokenAddress: resolved.tokenAddress || resolved.asset.tokenAddress }
      : resolved.asset;

    const mintError = getMintOwnershipError({
      order: input.order,
      listing: resolved.listing,
      asset: effectiveAsset,
      walletAddress: input.walletAddress,
      accessToken: input.accessToken,
    });
    if (mintError) {
      return { kind: "error", message: mintError };
    }

    const result = await this.requestMint({
      accessToken: input.accessToken!,
      body: buildMintOwnershipRequest({
        order: input.order,
        asset: {
          tokenAddress: resolved.tokenAddress,
          tokenStandard: effectiveAsset?.tokenStandard,
        },
        walletAddress: input.walletAddress,
      }),
    });

    if (result.error) {
      return { kind: "error", message: result.error };
    }

    return {
      kind: "success",
      result,
      toast: getMintOwnershipSuccessMessage({
        status: result.status,
        txHash: result.txHash,
      }),
      listing: resolved.listing,
      asset: resolved.asset,
      tokenAddress: resolved.tokenAddress,
    };
  }
}
