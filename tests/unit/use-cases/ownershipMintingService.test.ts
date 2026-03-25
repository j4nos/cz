import { describe, expect, it, vi } from "vitest";

import { OwnershipMintingService } from "@/src/application/use-cases/ownershipMintingService";
import {
  buildMintOwnershipRequest,
  getMintOwnershipError,
  getMintOwnershipSuccessMessage,
} from "@/src/application/use-cases/ownershipMinting";
import { makeAsset, makeListing, makeOrder } from "@/tests/helpers/factories";

function makeReadRepository(input?: { listing?: ReturnType<typeof makeListing> | null; asset?: ReturnType<typeof makeAsset> | null }) {
  return {
    getAssetById: vi.fn().mockResolvedValue(input && "asset" in input ? input.asset : makeAsset({ tokenAddress: "0xtoken" })),
    getListingById: vi.fn().mockResolvedValue(input && "listing" in input ? input.listing : makeListing()),
  };
}

describe("ownershipMinting helpers", () => {
  it("returns validation errors for missing prerequisites", () => {
    expect(getMintOwnershipError({ order: null, listing: makeListing(), asset: makeAsset({ tokenAddress: "0x" }) })).toBe(
      "Order not found.",
    );
    expect(getMintOwnershipError({ order: makeOrder(), listing: null, asset: makeAsset({ tokenAddress: "0x" }) })).toBe(
      "Listing not found.",
    );
    expect(getMintOwnershipError({ order: makeOrder(), listing: makeListing(), asset: makeAsset({ tokenAddress: undefined }) })).toBe(
      "Missing token address for this listing.",
    );
    expect(
      getMintOwnershipError({
        order: makeOrder({ investorWalletAddress: undefined }),
        listing: makeListing(),
        asset: makeAsset({ tokenAddress: "0x" }),
        accessToken: "token",
      }),
    ).toBe("Missing investor wallet address.");
    expect(
      getMintOwnershipError({
        order: makeOrder({ investorWalletAddress: "0xwallet" }),
        listing: makeListing(),
        asset: makeAsset({ tokenAddress: "0x" }),
      }),
    ).toBe("Missing access token.");
  });

  it("builds a mint request with the explicit wallet address and normalized standard", () => {
    expect(
      buildMintOwnershipRequest({
        order: makeOrder({ quantity: 3, investorWalletAddress: "0xorderwallet" }),
        asset: { tokenAddress: "0xtoken", tokenStandard: "erc-721" },
        walletAddress: " 0xinputwallet ",
      }),
    ).toEqual({
      tokenAddress: "0xtoken",
      to: "0xinputwallet",
      amount: 3,
      orderId: "order-1",
      tokenStandard: "erc-721",
    });
  });

  it("returns warning or success toasts based on mint status", () => {
    expect(getMintOwnershipSuccessMessage({ status: "queued" })).toEqual({
      message: "Withdraw queued for minting.",
      tone: "warning",
    });
    expect(getMintOwnershipSuccessMessage({ txHash: "0xtx" })).toEqual({
      message: "Withdraw initiated. Tx: 0xtx",
      tone: "success",
    });
  });
});

describe("OwnershipMintingService", () => {
  it("returns an error when the order is missing", async () => {
    const service = new OwnershipMintingService(makeReadRepository(), vi.fn());

    await expect(service.mint({ order: null, accessToken: "token" })).resolves.toEqual({
      kind: "error",
      message: "Order not found.",
    });
  });

  it("returns an error when the listing cannot be resolved", async () => {
    const service = new OwnershipMintingService(makeReadRepository({ listing: null }), vi.fn());

    const result = await service.mint({ order: makeOrder(), accessToken: "token" });

    expect(result).toEqual({ kind: "error", message: "Listing not found." });
  });

  it("returns an error when the token address is missing", async () => {
    const service = new OwnershipMintingService(
      makeReadRepository({ asset: makeAsset({ tokenAddress: undefined }) }),
      vi.fn(),
    );

    const result = await service.mint({ order: makeOrder({ investorWalletAddress: "0xwallet" }), accessToken: "token" });

    expect(result).toEqual({ kind: "error", message: "Missing token address for this listing." });
  });

  it("returns an error when both wallet addresses are missing", async () => {
    const service = new OwnershipMintingService(makeReadRepository(), vi.fn());

    const result = await service.mint({ order: makeOrder({ investorWalletAddress: undefined }), accessToken: "token" });

    expect(result).toEqual({ kind: "error", message: "Missing investor wallet address." });
  });

  it("returns a warning toast when the mint request stays pending", async () => {
    const requestMint = vi.fn().mockResolvedValue({ status: "queued" });
    const service = new OwnershipMintingService(makeReadRepository(), requestMint);

    const result = await service.mint({
      order: makeOrder({ investorWalletAddress: "0xwallet" }),
      accessToken: "token",
    });

    expect(result).toMatchObject({
      kind: "success",
      toast: { tone: "warning", message: "Withdraw queued for minting." },
      tokenAddress: "0xtoken",
    });
  });

  it("returns a success result with tx hash details when minting is initiated", async () => {
    const requestMint = vi.fn().mockResolvedValue({ status: "minted", txHash: "0xtxhash" });
    const service = new OwnershipMintingService(makeReadRepository(), requestMint);

    const result = await service.mint({
      order: makeOrder({ investorWalletAddress: "0xwallet" }),
      accessToken: "token",
      walletAddress: "0xotherwallet",
    });

    expect(requestMint).toHaveBeenCalledWith({
      accessToken: "token",
      body: {
        tokenAddress: "0xtoken",
        to: "0xotherwallet",
        amount: 2,
        orderId: "order-1",
        tokenStandard: "erc-20",
      },
    });
    expect(result).toMatchObject({
      kind: "success",
      toast: { tone: "success", message: "Withdraw initiated. Tx: 0xtxhash" },
    });
  });
});
