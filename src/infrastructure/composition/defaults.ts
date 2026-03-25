import { ethers } from "ethers";
import type { AuthClient } from "@/src/application/interfaces/authClient";
import { OwnershipMintingProcessorService } from "@/src/application/use-cases/ownershipMintingProcessorService";
import { PowensPaymentSyncService } from "@/src/application/use-cases/powensPaymentSyncService";
import { RequestPowensPaymentService } from "@/src/application/use-cases/requestPowensPaymentService";
import { PowensPaymentStatusService } from "@/src/application/use-cases/powensPaymentStatusService";
import { RequestOwnershipMintingService } from "@/src/application/use-cases/requestOwnershipMintingService";
import { CouponPreviewService } from "@/src/application/use-cases/couponPreviewService";
import { DeleteAccountService } from "@/src/application/use-cases/deleteAccountService";
import { SaveAssetDraftService } from "@/src/application/use-cases/saveAssetDraftService";
import { SubmitAssetService } from "@/src/application/use-cases/submitAssetService";
import { TokenizationService } from "@/src/application/use-cases/tokenizationService";
import { InvestmentPlatformService } from "@/src/application/use-cases/investmentPlatformService";
import { getPowensEnv } from "@/src/config/powensEnv";
import { getAppUrlEnv } from "@/src/config/runtimeEnv";
import { createAmplifyAuthClient } from "@/src/infrastructure/auth/amplifyAuthClient";
import { deleteCognitoUser } from "@/src/infrastructure/auth/cognitoAccountAdminClient";
import { DynamoDbRequestClaimGateway } from "@/src/infrastructure/gateways/dynamoDbRequestClaimGateway";
import { EthersOwnershipMintingGateway } from "@/src/infrastructure/gateways/ethersOwnershipMintingGateway";
import { EthersTokenizationGateway } from "@/src/infrastructure/gateways/ethersTokenizationGateway";
import { AmplifyInvestmentRepository } from "@/src/infrastructure/repositories/amplifyInvestmentRepository";

class RuntimeIdGenerator {
  next(): string {
    return `id-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
}

class RuntimeClock {
  now(): string {
    return new Date().toISOString();
  }
}

class TokenizationRunIdGenerator {
  next(): string {
    return typeof crypto !== "undefined" ? crypto.randomUUID() : `run-${Date.now()}`;
  }
}

let investmentRepository: AmplifyInvestmentRepository | null = null;
let authClient: AuthClient | null = null;

export function createInvestmentRepository(input?: {
  readAuthMode?: import("@/src/infrastructure/repositories/amplifyClient").AmplifyReadAuthMode;
  authToken?: string;
}): AmplifyInvestmentRepository {
  if (input?.authToken || input?.readAuthMode) {
    return new AmplifyInvestmentRepository(undefined, input.readAuthMode, input.authToken);
  }

  if (!investmentRepository) {
    investmentRepository = new AmplifyInvestmentRepository();
  }

  return investmentRepository;
}

export function createInvestmentPlatformService(
  repository: AmplifyInvestmentRepository = createInvestmentRepository(),
) {
  return new InvestmentPlatformService(repository, new RuntimeIdGenerator(), new RuntimeClock());
}

export function createTokenizationService(
  authToken?: string,
  repository: AmplifyInvestmentRepository = createInvestmentRepository({
    readAuthMode: authToken ? "lambda" : undefined,
    authToken,
  }),
) {
  return new TokenizationService(
    repository,
    new EthersTokenizationGateway(),
    new TokenizationRunIdGenerator(),
    new DynamoDbRequestClaimGateway(),
  );
}

export function createSubmitAssetService(
  authToken?: string,
  repository: AmplifyInvestmentRepository = createInvestmentRepository({
    readAuthMode: authToken ? "lambda" : undefined,
    authToken,
  }),
) {
  const tokenizationService = createTokenizationService(authToken, repository);
  return new SubmitAssetService(repository, async ({ assetId, userId, name, tokenStandard }) => {
    const result = await tokenizationService.tokenizeAsset({
      assetId,
      userId,
      name,
      tokenStandard,
    });
    return { address: result.address };
  });
}

export function createOwnershipMintingProcessorService(
  repository: AmplifyInvestmentRepository = createInvestmentRepository(),
) {
  return new OwnershipMintingProcessorService(
    repository,
    new EthersOwnershipMintingGateway(),
    new DynamoDbRequestClaimGateway(),
  );
}

export function createRequestOwnershipMintingService(
  authToken?: string,
  repository: AmplifyInvestmentRepository = createInvestmentRepository({
    readAuthMode: authToken ? "lambda" : undefined,
    authToken,
  }),
) {
  return new RequestOwnershipMintingService(
    repository,
    createOwnershipMintingProcessorService(repository),
    ethers.isAddress,
  );
}

export function createPowensPaymentSyncService(
  repository: AmplifyInvestmentRepository = createInvestmentRepository(),
) {
  const investmentPlatformService = createInvestmentPlatformService(repository);
  return new PowensPaymentSyncService(repository, ({ orderId }) =>
    investmentPlatformService.completeOrderPayment({ orderId }),
  );
}

export function createSaveAssetDraftService(
  authToken?: string,
  repository: AmplifyInvestmentRepository = createInvestmentRepository({
    readAuthMode: authToken ? "lambda" : undefined,
    authToken,
  }),
) {
  return new SaveAssetDraftService(repository);
}

export function createDeleteAccountService(
  authToken?: string,
  repository: AmplifyInvestmentRepository = createInvestmentRepository({
    readAuthMode: authToken ? "lambda" : undefined,
    authToken,
  }),
) {
  return new DeleteAccountService(repository, deleteCognitoUser);
}

export function createRequestPowensPaymentService(
  authToken?: string,
  repository: AmplifyInvestmentRepository = createInvestmentRepository({
    readAuthMode: authToken ? "lambda" : undefined,
    authToken,
  }),
) {
  const normalizeBaseUrl = (value: string) => value.replace(/\/+$/, "");
  const getPowensBaseUrl = () => {
    const { POWENS_DOMAIN: domain } = getPowensEnv();
    return domain ? `https://${domain}.biapi.pro/2.0` : "";
  };
  const powensBaseUrl = getPowensBaseUrl();

  return new RequestPowensPaymentService(
    repository,
    {
      async getAdminToken() {
        const { POWENS_CLIENT_ID: clientId, POWENS_CLIENT_SECRET: clientSecret } = getPowensEnv();
        const tokenRes = await fetch(normalizeBaseUrl(`${powensBaseUrl}/auth/token`), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scope: "payments:admin",
            grant_type: "client_credentials",
            client_id: clientId,
            client_secret: clientSecret,
          }),
        });
        const tokenData = (await tokenRes.json()) as {
          token?: string;
          access_token?: string;
          error?: string;
          message?: string;
        };
        const accessToken = tokenData.token || tokenData.access_token || "";
        if (!tokenRes.ok || !accessToken) {
          throw new Error(tokenData.error || tokenData.message || "Failed to fetch access token.");
        }
        return accessToken;
      },
      async createPayment(input) {
        const paymentRes = await fetch(`${powensBaseUrl}/payments`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${input.adminToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            client_redirect_uri: input.redirectUri,
            client_state: input.orderId,
            instructions: [
              {
                amount: input.total,
                currency: input.currency,
                label: `Cityzeen order ${input.orderId}`,
                execution_date_type: "first_open_day",
                beneficiary: {
                  scheme_name: "iban",
                  identification: input.beneficiaryIban,
                  label: input.beneficiaryLabel,
                },
              },
            ],
          }),
        });
        const paymentRaw = await paymentRes.text();
        const paymentData = (() => {
          try {
            return JSON.parse(paymentRaw) as {
              id?: number | string;
              state?: string;
              error?: string;
              message?: string;
            };
          } catch {
            return { message: paymentRaw };
          }
        })();
        if (!paymentRes.ok || !paymentData.id) {
          throw new Error(paymentData.error || paymentData.message || "Failed to create payment.");
        }
        return {
          paymentId: String(paymentData.id),
          paymentState: paymentData.state ?? "created",
        };
      },
      async getPaymentScopedToken(input) {
        const scopedRes = await fetch(
          normalizeBaseUrl(`${powensBaseUrl}/payments/${input.paymentId}/scopedtoken`),
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${input.adminToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ scope: "payments:validate" }),
          },
        );
        const scopedRaw = await scopedRes.text();
        const scopedData = (() => {
          try {
            return JSON.parse(scopedRaw) as {
              token?: string;
              error?: string;
              message?: string;
            };
          } catch {
            return { message: scopedRaw };
          }
        })();
        const scopedToken = scopedData.token || "";
        if (!scopedRes.ok || !scopedToken) {
          throw new Error(scopedData.error || scopedData.message || "Failed to fetch payment scoped token.");
        }
        return scopedToken;
      },
    },
    {
      appUrl: getAppUrlEnv(),
      powensBaseUrl,
      powensClientId: getPowensEnv().POWENS_CLIENT_ID,
    },
  );
}

export function createPowensPaymentStatusService(
  authToken?: string,
  repository: AmplifyInvestmentRepository = createInvestmentRepository({
    readAuthMode: authToken ? "lambda" : undefined,
    authToken,
  }),
) {
  console.log("[powens] createPowensPaymentStatusService", {
    hasAuthToken: Boolean(authToken),
    readAuthMode: authToken ? "lambda" : "default",
  });
  const normalizeBaseUrl = (value: string) => value.replace(/\/+$/, "");
  const getPowensBaseUrl = () => {
    const { POWENS_DOMAIN: domain } = getPowensEnv();
    return domain ? `https://${domain}.biapi.pro/2.0` : "";
  };
  const powensBaseUrl = getPowensBaseUrl();

  return new PowensPaymentStatusService(
    repository,
    createPowensPaymentSyncService(repository),
    {
      async getAdminToken() {
        const { POWENS_CLIENT_ID: clientId, POWENS_CLIENT_SECRET: clientSecret } = getPowensEnv();
        const tokenRes = await fetch(normalizeBaseUrl(`${powensBaseUrl}/auth/token`), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scope: "payments:admin",
            grant_type: "client_credentials",
            client_id: clientId,
            client_secret: clientSecret,
          }),
        });
        const tokenData = (await tokenRes.json()) as {
          token?: string;
          access_token?: string;
          error?: string;
          message?: string;
        };
        const accessToken = tokenData.token || tokenData.access_token || "";
        if (!tokenRes.ok || !accessToken) {
          throw new Error(tokenData.error || tokenData.message || "Failed to fetch access token.");
        }
        return accessToken;
      },
      async getPaymentState(input) {
        const paymentRes = await fetch(`${powensBaseUrl}/payments/${input.paymentProviderId}`, {
          headers: { Authorization: `Bearer ${input.adminToken}` },
        });
        const paymentData = (await paymentRes.json()) as {
          state?: string;
          error?: string;
          message?: string;
        };
        if (!paymentRes.ok) {
          throw new Error(paymentData.error || paymentData.message || "Failed to fetch payment.");
        }
        return paymentData.state ?? "";
      },
    },
  );
}

export function createCouponPreviewService(
  repository: AmplifyInvestmentRepository = new AmplifyInvestmentRepository(undefined, "apiKey"),
) {
  return new CouponPreviewService(repository);
}

export function getAmplifyAuthClient(): AuthClient {
  if (!authClient) {
    authClient = createAmplifyAuthClient(createInvestmentRepository());
  }

  return authClient;
}
