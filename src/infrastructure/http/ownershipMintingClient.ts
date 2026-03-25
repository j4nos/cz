"use client";

export async function requestOwnershipMint(input: {
  accessToken: string;
  body: object;
}) {
  const response = await fetch("/api/mint-ownership", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${input.accessToken}`,
    },
    body: JSON.stringify(input.body),
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error((result as { error?: string })?.error || "Mint API error");
  }

  return result as {
    status?: string;
    txHash?: string;
    mintRequestedAt?: string;
    mintedAt?: string;
    error?: string;
  };
}
