import { generateClient } from "aws-amplify/data";

import type { Schema } from "@/amplify/data/resource";
import { ensureAmplifyConfigured } from "@/src/config/amplify";

export type AmplifyDataClient = ReturnType<typeof generateClient<Schema>>;
export type AmplifyReadAuthMode = "apiKey" | "userPool" | "lambda";

export function createAmplifyDataClient(): AmplifyDataClient {
  ensureAmplifyConfigured();
  return generateClient<Schema>();
}
