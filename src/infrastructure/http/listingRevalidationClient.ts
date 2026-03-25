"use client";

export async function revalidateListings(input: {
  accessToken?: string | null;
  listingId?: string;
  listingIds?: string[];
}) {
  await fetch("/api/asset-provider/revalidate-listings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(input.accessToken ? { Authorization: `Bearer ${input.accessToken}` } : {}),
    },
    body: JSON.stringify({
      ...(input.listingId ? { listingId: input.listingId } : {}),
      ...(input.listingIds ? { listingIds: input.listingIds } : {}),
    }),
  });
}
