const ERC_721_ALIASES = new Set(["erc-721", "erc721"]);

export type NormalizedTokenStandard = "erc-20" | "erc-721";

export function normalizeTokenStandard(
  value?: string | null,
  fallback: NormalizedTokenStandard = "erc-20",
): NormalizedTokenStandard {
  const normalized = value?.trim().toLowerCase() || "";
  return ERC_721_ALIASES.has(normalized) ? "erc-721" : fallback;
}

export function isErc721TokenStandard(value?: string | null): boolean {
  return normalizeTokenStandard(value) === "erc-721";
}