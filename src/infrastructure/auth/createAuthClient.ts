"use client";

import type { AuthClient } from "@/src/application/interfaces/authClient";
import { getAmplifyAuthClient } from "@/src/infrastructure/composition/defaults";

export function createAuthClient(): AuthClient {
  return getAmplifyAuthClient();
}
