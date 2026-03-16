import { ethers } from "ethers";

import erc20Artifact from "@/artifacts/contracts/AssetToken20.sol/AssetToken20.json";
import erc721Artifact from "@/artifacts/contracts/AssetToken721.sol/AssetToken721.json";
import type { OwnershipMintingGateway } from "@/src/application/use-cases/ownershipMintingProcessorService";
import { DomainError } from "@/src/domain/value-objects/errors";
import { normalizeTokenStandard } from "@/src/domain/value-objects/tokenStandard";

function getMintingEnv() {
  const rpcUrl = process.env.POLYGON_RPC_URL?.trim() || process.env.RPC_URL?.trim() || "";
  const privateKey = process.env.PRIVATE_KEY?.trim() || "";

  if (!rpcUrl || !privateKey) {
    throw new DomainError({ code: "RPC_CONFIG_MISSING" });
  }

  return { rpcUrl, privateKey };
}

export class EthersOwnershipMintingGateway implements OwnershipMintingGateway {
  async mint(input: {
    tokenAddress: string;
    to: string;
    amount: number;
    tokenStandard?: string;
  }): Promise<{ txHash: string; tokenId?: string }> {
    if (!ethers.isAddress(input.tokenAddress)) {
      throw new DomainError({ code: "INVALID_TOKEN_ADDRESS" });
    }

    if (!ethers.isAddress(input.to)) {
      throw new DomainError({ code: "INVALID_INVESTOR_WALLET_ADDRESS" });
    }

    const { rpcUrl, privateKey } = getMintingEnv();
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    const standard = normalizeTokenStandard(input.tokenStandard);

    if (standard === "erc-721") {
      const contract = new ethers.Contract(
        input.tokenAddress,
        erc721Artifact.abi as ethers.InterfaceAbi,
        wallet,
      );
      const tx = await contract.mint(input.to);
      const receipt = await tx.wait();
      const tokenId = receipt?.logs
        ?.map((log: ethers.Log | ethers.EventLog) => {
          try {
            return contract.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .find((log: ethers.LogDescription | null) => log?.name === "Transfer")?.args?.tokenId;

      return {
        txHash: tx.hash,
        tokenId: tokenId ? tokenId.toString() : undefined,
      };
    }

    const contract = new ethers.Contract(
      input.tokenAddress,
      erc20Artifact.abi as ethers.InterfaceAbi,
      wallet,
    );
    const tx = await contract.mint(input.to, BigInt(input.amount));
    await tx.wait();

    return {
      txHash: tx.hash,
    };
  }
}
