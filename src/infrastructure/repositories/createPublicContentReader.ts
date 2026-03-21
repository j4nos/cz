import type { PublicContentReader } from "@/src/application/use-cases/publicContent";
import { AmplifyInvestmentRepository } from "@/src/infrastructure/repositories/amplifyInvestmentRepository";
import { createAmplifyDataClient } from "@/src/infrastructure/repositories/amplifyClient";
import { AmplifyPublicContentReader } from "@/src/infrastructure/repositories/amplifyPublicContentReader";

export function createPublicContentReader(): PublicContentReader {
  return new AmplifyPublicContentReader(
    new AmplifyInvestmentRepository(createAmplifyDataClient(), "apiKey"),
  );
}
