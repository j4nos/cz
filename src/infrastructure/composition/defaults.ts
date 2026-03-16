import type { AuthClient } from "@/src/application/interfaces/authClient";
import { OwnershipMintingProcessorService } from "@/src/application/use-cases/ownershipMintingProcessorService";
import { PowensPaymentSyncService } from "@/src/application/use-cases/powensPaymentSyncService";
import { TokenizationService } from "@/src/application/use-cases/tokenizationService";
import { InvestmentPlatformService } from "@/src/application/use-cases/investmentPlatformService";
import { createAmplifyAuthClient } from "@/src/infrastructure/auth/amplifyAuthClient";
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

export function createInvestmentRepository(): AmplifyInvestmentRepository {
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
  repository: AmplifyInvestmentRepository = createInvestmentRepository(),
) {
  return new TokenizationService(
    repository,
    new EthersTokenizationGateway(),
    new TokenizationRunIdGenerator(),
    new DynamoDbRequestClaimGateway(),
  );
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

export function createPowensPaymentSyncService(
  repository: AmplifyInvestmentRepository = createInvestmentRepository(),
) {
  return new PowensPaymentSyncService(repository);
}

export function getAmplifyAuthClient(): AuthClient {
  if (!authClient) {
    authClient = createAmplifyAuthClient(createInvestmentRepository());
  }

  return authClient;
}