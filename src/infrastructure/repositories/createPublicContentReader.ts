import type { PublicContentReader } from "@/src/application/publicContent";
import { AmplifyPublicContentReader } from "@/src/infrastructure/repositories/amplifyPublicContentReader";

export function createPublicContentReader(): PublicContentReader {
  return new AmplifyPublicContentReader();
}
