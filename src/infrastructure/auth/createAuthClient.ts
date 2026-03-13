"use client";

import type { AuthClient } from "@/src/auth/client";
import { createAmplifyAuthClient } from "@/src/infrastructure/auth/amplifyAuthClient";

export function createAuthClient(): AuthClient {
  return createAmplifyAuthClient();
}
