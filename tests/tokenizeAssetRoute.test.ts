// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ethers } from "ethers";
import { POST } from "@/app/api/tokenize-asset/route";
import { generateClient } from "aws-amplify/data";

vi.mock("aws-amplify/data", () => ({ generateClient: vi.fn() }));
vi.mock("@/src/config/amplify", () => ({ ensureAmplifyConfigured: vi.fn() }));
vi.mock("@/artifacts/contracts/AssetToken20.sol/AssetToken20.json", () => ({
  default: { abi: [], bytecode: "0x00" },
}));
vi.mock("@/artifacts/contracts/AssetToken721.sol/AssetToken721.json", () => ({
  default: { abi: [], bytecode: "0x01" },
}));
vi.mock("ethers", () => {
  const isAddress = vi.fn((value: string) => value.startsWith("0x"));
  class JsonRpcProvider {
    constructor(...args: unknown[]) {
      void args;
    }
  }
  class Wallet {
    address = "0xwallet";
    constructor(...args: unknown[]) {
      void args;
    }
  }
  const deploy = vi.fn().mockResolvedValue({
    waitForDeployment: vi.fn(),
    getAddress: vi.fn().mockResolvedValue("0xcontract"),
  });
  const supportsInterface = vi.fn().mockResolvedValue(true);
  class ContractFactory {
    deploy = deploy;
    constructor(...args: unknown[]) {
      void args;
    }
  }
  class Contract {
    supportsInterface = supportsInterface;
    constructor(...args: unknown[]) {
      void args;
    }
  }

  return {
    ethers: {
      isAddress,
      JsonRpcProvider,
      Wallet,
      ContractFactory,
      Contract,
      __mocks: { deploy, supportsInterface, isAddress },
    },
  };
});

const makeRequest = (body: Record<string, unknown>) =>
  new Request("http://localhost/api/tokenize-asset", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });

const ethersMock = ethers as typeof ethers & {
  __mocks: {
    deploy: ReturnType<typeof vi.fn>;
    supportsInterface: ReturnType<typeof vi.fn>;
    isAddress: ReturnType<typeof vi.fn>;
  };
};

beforeEach(() => {
  vi.mocked(generateClient).mockReset();
  process.env.POLYGON_RPC_URL = "http://rpc";
  process.env.PRIVATE_KEY = "secret";
});

describe("POST /api/tokenize-asset", () => {
  it("returns 400 when assetId or userId is missing", async () => {
    const res = await POST(makeRequest({ assetId: "asset-1" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid owner address", async () => {
    const assetGet = vi.fn().mockResolvedValue({
      data: {
        id: "asset-1",
        tenantUserId: "provider-1",
        name: "Asset",
        country: "HU",
        assetClass: "REAL_ESTATE",
        status: "DRAFT",
        missingDocsCount: 0,
        imageUrls: [],
      },
    });
    const assetUpdate = vi.fn().mockResolvedValue({
      data: {
        id: "asset-1",
        tenantUserId: "provider-1",
        name: "Asset",
        country: "HU",
        assetClass: "REAL_ESTATE",
        status: "DRAFT",
        missingDocsCount: 0,
        imageUrls: [],
      },
    });
    (vi.mocked(generateClient) as unknown as { mockReturnValueOnce: (value: unknown) => void }).mockReturnValueOnce({
      models: { Asset: { get: assetGet, update: assetUpdate } },
    });

    const res = await POST(
      makeRequest({ assetId: "asset-1", userId: "provider-1", owner: "not-an-address" }),
    );
    expect(res.status).toBe(400);
    expect(ethersMock.__mocks.isAddress).toHaveBeenCalled();
  });

  it("returns 500 when rpc config is missing", async () => {
    const assetGet = vi.fn().mockResolvedValue({
      data: {
        id: "asset-1",
        tenantUserId: "provider-1",
        name: "Asset",
        country: "HU",
        assetClass: "REAL_ESTATE",
        status: "DRAFT",
        missingDocsCount: 0,
        imageUrls: [],
      },
    });
    const assetUpdate = vi.fn().mockResolvedValue({
      data: {
        id: "asset-1",
        tenantUserId: "provider-1",
        name: "Asset",
        country: "HU",
        assetClass: "REAL_ESTATE",
        status: "DRAFT",
        missingDocsCount: 0,
        imageUrls: [],
      },
    });
    (vi.mocked(generateClient) as unknown as { mockReturnValueOnce: (value: unknown) => void }).mockReturnValueOnce({
      models: { Asset: { get: assetGet, update: assetUpdate } },
    });
    process.env.POLYGON_RPC_URL = "";
    process.env.PRIVATE_KEY = "";

    const res = await POST(makeRequest({ assetId: "asset-1", userId: "provider-1" }));
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: "RPC or private key missing." });
  });

  it("deploys contract and returns address", async () => {
    const assetGet = vi.fn().mockResolvedValue({
      data: {
        id: "asset-1",
        tenantUserId: "provider-1",
        name: "Asset",
        country: "HU",
        assetClass: "REAL_ESTATE",
        tokenStandard: "ERC-721",
        status: "DRAFT",
        missingDocsCount: 0,
        imageUrls: [],
      },
    });
    const assetUpdate = vi.fn().mockResolvedValue({
      data: {
        id: "asset-1",
        tenantUserId: "provider-1",
        name: "Asset",
        country: "HU",
        assetClass: "REAL_ESTATE",
        tokenStandard: "ERC-721",
        status: "DRAFT",
        missingDocsCount: 0,
        tokenAddress: "0xcontract",
        latestRunId: "run-1",
        imageUrls: [],
      },
    });
    (vi.mocked(generateClient) as unknown as { mockReturnValueOnce: (value: unknown) => void }).mockReturnValueOnce({
      models: { Asset: { get: assetGet, update: assetUpdate } },
    });

    const res = await POST(
      makeRequest({
        assetId: "asset-1",
        userId: "provider-1",
        tokenStandard: "erc-721",
        name: "Demo",
        symbol: "DMO",
      }),
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      address: "0xcontract",
      standard: "erc-721",
      supportsErc721: true,
    });
    expect(ethersMock.__mocks.deploy).toHaveBeenCalled();
    expect(ethersMock.__mocks.supportsInterface).toHaveBeenCalled();
  });
});
