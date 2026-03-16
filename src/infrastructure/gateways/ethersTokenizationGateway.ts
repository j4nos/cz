import { ethers } from "ethers";

import type { TokenizationGateway } from "@/src/application/interfaces/tokenizationPorts";
import { DomainError } from "@/src/domain/value-objects/errors";
import { isErc721TokenStandard, normalizeTokenStandard } from "@/src/domain/value-objects/tokenStandard";
import erc20Artifact from "@/artifacts/contracts/AssetToken20.sol/AssetToken20.json";
import erc721Artifact from "@/artifacts/contracts/AssetToken721.sol/AssetToken721.json";

function getTokenizationEnv() {
  const rpcUrl = process.env.POLYGON_RPC_URL?.trim() || process.env.RPC_URL?.trim() || "";
  const privateKey = process.env.PRIVATE_KEY?.trim() || "";

  if (!rpcUrl || !privateKey) {
    throw new DomainError({ code: "RPC_CONFIG_MISSING" });
  }

  return { rpcUrl, privateKey };
}

export class EthersTokenizationGateway implements TokenizationGateway {
  async tokenize(input: {
    assetId: string;
    name: string;
    symbol: string;
    owner?: string;
    tokenStandard?: string;
  }): Promise<{ address: string; standard: string; supportsErc721: boolean }> {
    const ownerAddress = input.owner?.trim() || "";
    if (ownerAddress && !ethers.isAddress(ownerAddress)) {
      throw new DomainError({ code: "INVALID_OWNER_ADDRESS" });
    }

    const { rpcUrl, privateKey } = getTokenizationEnv();
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    const standard = normalizeTokenStandard(input.tokenStandard);
    const artifact = standard === "erc-721" ? erc721Artifact : erc20Artifact;
    const factory = new ethers.ContractFactory(
      artifact.abi as ethers.InterfaceAbi,
      artifact.bytecode as ethers.BytesLike,
      wallet,
    );

    const contract = await factory.deploy(
      input.name || "Asset Share",
      input.symbol || "ASSET",
      ownerAddress || wallet.address,
    );
    await contract.waitForDeployment();
    const address = await contract.getAddress();

    let supportsErc721 = false;
    if (isErc721TokenStandard(standard)) {
      try {
        const checker = new ethers.Contract(
          address,
          ["function supportsInterface(bytes4 interfaceId) external view returns (bool)"] as ethers.InterfaceAbi,
          provider,
        );
        supportsErc721 = await checker.supportsInterface("0x80ac58cd");
      } catch {
        supportsErc721 = false;
      }
    }

    return {
      address,
      standard,
      supportsErc721,
    };
  }
}
