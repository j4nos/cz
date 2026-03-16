import type { PublicContentReader } from "@/src/application/use-cases/publicContent";
import { createInvestmentRepository } from "@/src/infrastructure/composition/defaults";
import { AmplifyPublicContentReader } from "@/src/infrastructure/repositories/amplifyPublicContentReader";

export function createPublicContentReader(): PublicContentReader {
  return new AmplifyPublicContentReader(createInvestmentRepository());
}
