// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ethers } from "ethers";
import { POST } from "@/app/api/tokenize-asset/route";
import { generateClient } from "aws-amplify/data";

vi.mock("aws-amplify/data", () => ({ generateClient: vi.fn() }));
vi.mock("@/src/config/amplify", () => ({ ensureAmplifyConfigured: vi.fn() }));
vi.mock("@/src/infrastructure/auth/verifyAccessToken", () => ({
  verifyAccessToken: vi.fn().mockResolvedValue({ sub: "provider-1" }),
}));
vi.mock("@/src/infrastructure/gateways/dynamoDbRequestClaimGateway", () => ({
  DynamoDbRequestClaimGateway: class {
    async claimContractDeploymentRequest() {
      return true;
    }

    async claimMintRequest() {
      return true;
    }
  },
}));
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
      authorization: "Bearer test-token",
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

const generateClientMockFacade: {
  mockReset(): void;
  mockReturnValueOnce(client: unknown): void;
} = generateClient as never;

const setGenerateClientReturnValueOnce = (value: ReturnType<typeof makeClientMock>) => {
  generateClientMockFacade.mockReturnValueOnce(value);
};

const makeClientMock = (assetGet: ReturnType<typeof vi.fn>, assetUpdate: ReturnType<typeof vi.fn>) => {
  const requestCreate = vi.fn().mockResolvedValue({
    data: {
      id: "contract-deployment:asset-1",
      assetId: "asset-1",
      idempotencyKey: "contract-deployment:asset-1",
      deploymentStatus: "queued",
      runId: "run-1",
      tokenStandard: "erc-721",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  });
  const requestGet = vi.fn().mockResolvedValue({ data: null });
  const requestUpdate = vi.fn().mockResolvedValue({
    data: {
      id: "contract-deployment:asset-1",
      assetId: "asset-1",
      idempotencyKey: "contract-deployment:asset-1",
      deploymentStatus: "submitted",
      runId: "run-1",
      tokenStandard: "erc-721",
      tokenAddress: "0xcontract",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  });

  return {
    models: {
      Asset: { get: assetGet, update: assetUpdate },
      ContractDeploymentRequest: {
        create: requestCreate,
        get: requestGet,
        update: requestUpdate,
      },
    },
  };
};

beforeEach(() => {
  generateClientMockFacade.mockReset();
  process.env.POLYGON_RPC_URL = "http://rpc";
  process.env.PRIVATE_KEY = "secret";
  ethersMock.__mocks.isAddress.mockImplementation((value: string) => value.startsWith("0x"));
  ethersMock.__mocks.deploy.mockResolvedValue({
    waitForDeployment: vi.fn(),
    getAddress: vi.fn().mockResolvedValue("0xcontract"),
  });
});

describe("POST /api/tokenize-asset", () => {
  it("returns 400 when assetId is missing", async () => {
    const res = await POST(makeRequest({}));
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
    setGenerateClientReturnValueOnce(makeClientMock(assetGet, assetUpdate));

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
    setGenerateClientReturnValueOnce(makeClientMock(assetGet, assetUpdate));
    process.env.POLYGON_RPC_URL = "";
    process.env.PRIVATE_KEY = "";

    const res = await POST(makeRequest({ assetId: "asset-1" }));
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
    setGenerateClientReturnValueOnce(makeClientMock(assetGet, assetUpdate));

    const res = await POST(
      makeRequest({
        assetId: "asset-1",
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
