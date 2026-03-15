function readRequiredEnv(name: string): string {
  const value = process.env[name]?.trim() ?? "";
  if (!value) {
    throw new Error("Missing Powens configuration.");
  }

  return value;
}

export function getPowensEnv() {
  return {
    POWENS_DOMAIN: readRequiredEnv("POWENS_DOMAIN"),
    POWENS_CLIENT_ID: readRequiredEnv("POWENS_CLIENT_ID"),
    POWENS_CLIENT_SECRET: readRequiredEnv("POWENS_CLIENT_SECRET"),
  };
}

export function getPowensWebhookSecret() {
  return process.env.POWENS_WEBHOOK_SECRET?.trim() || "";
}
