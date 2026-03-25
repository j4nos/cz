import type { Schema } from "@/amplify/data/resource";
import { createAmplifyDataClient } from "@/src/infrastructure/repositories/amplifyClient";
import { toPublicStorageUrl } from "@/src/infrastructure/storage/publicUrls";

export type HomepageCtaContent = {
  href: string;
  title: string;
  text: string;
  image?: string;
  reverse?: boolean;
};

export async function getHomepageCtas(): Promise<{
  ctaOne: HomepageCtaContent | null;
  ctaTwo: HomepageCtaContent | null;
}> {
  const client = createAmplifyDataClient();
  const { data: settings } = await client.models.PlatformSettings.get(
    { id: "homepage" },
    { authMode: "apiKey" },
  );

  const firstListingId = settings?.homepageFirstListingId;
  const secondListingId = settings?.homepageSecondListingId;
  const firstAssetId = settings?.homepageFirstAssetId;
  const secondAssetId = settings?.homepageSecondAssetId;

  if (!firstListingId || !secondListingId || !firstAssetId || !secondAssetId) {
    return { ctaOne: null, ctaTwo: null };
  }

  const [firstListingResponse, secondListingResponse, firstAssetResponse, secondAssetResponse] =
    await Promise.all([
      client.models.Listing.get({ id: firstListingId }, { authMode: "apiKey" }),
      client.models.Listing.get({ id: secondListingId }, { authMode: "apiKey" }),
      client.models.Asset.get({ id: firstAssetId }, { authMode: "apiKey" }),
      client.models.Asset.get({ id: secondAssetId }, { authMode: "apiKey" }),
    ]);

  const toCta = (
    listingId: string,
    listing: Schema["Listing"]["type"] | null | undefined,
    fallbackText: string,
    image?: string,
  ): HomepageCtaContent => ({
    href: `/listings/${listingId}`,
    title: listing?.title ?? listingId,
    text: listing?.description || fallbackText,
    image,
  });

  const ctaOne = toCta(
    firstListingId,
    firstListingResponse.data,
    "Featured listing",
    firstAssetResponse.data?.imageUrls?.[0]
      ? toPublicStorageUrl(firstAssetResponse.data.imageUrls[0])
      : undefined,
  );

  const ctaTwo = {
    ...toCta(
      secondListingId,
      secondListingResponse.data,
      "Featured listing",
      secondAssetResponse.data?.imageUrls?.[0]
        ? toPublicStorageUrl(secondAssetResponse.data.imageUrls[0])
        : undefined,
    ),
    reverse: true,
  };

  return { ctaOne, ctaTwo };
}
