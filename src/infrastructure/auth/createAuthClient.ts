"use client";

import type { AuthClient } from "@/src/application/interfaces/authClient";
import { createAmplifyAuthClient } from "@/src/infrastructure/auth/amplifyAuthClient";

export function createAuthClient(): AuthClient {
  return createAmplifyAuthClient();
}
