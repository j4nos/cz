import { generateClient } from "aws-amplify/data";

import type { Schema } from "@/amplify/data/resource";
import { Hero } from "@/components/sections/Hero";
import { PhotoCta } from "@/components/sections/PhotoCta";
import { ensureAmplifyConfigured } from "@/src/config/amplify";
import { toPublicStorageUrl } from "@/src/infrastructure/storage/publicUrls";

type CtaContent = {
  href: string;
  title: string;
  text: string;
  image?: string;
  reverse?: boolean;
};

export const revalidate = 60;

export default async function Home() {
  ensureAmplifyConfigured();
  const client = generateClient<Schema>();
  const { data: settings } = await client.models.PlatformSettings.get(
    { id: "homepage" },
    { authMode: "apiKey" },
  );

  const firstListingId = settings?.homepageFirstListingId;
  const secondListingId = settings?.homepageSecondListingId;
  const firstAssetId = settings?.homepageFirstAssetId;
  const secondAssetId = settings?.homepageSecondAssetId;

  let ctaOne: CtaContent | null = null;
  let ctaTwo: CtaContent | null = null;

  if (
    !firstListingId ||
    !secondListingId ||
    !firstAssetId ||
    !secondAssetId
  ) {
  } else {
    const [firstListingResponse, secondListingResponse, firstAssetResponse, secondAssetResponse] =
      await Promise.all([
        client.models.Listing.get({ id: firstListingId }),
        client.models.Listing.get({ id: secondListingId }),
        client.models.Asset.get({ id: firstAssetId }),
        client.models.Asset.get({ id: secondAssetId }),
      ]);
    const firstListing = firstListingResponse.data;
    const secondListing = secondListingResponse.data;
    const firstAsset = firstAssetResponse.data;
    const secondAsset = secondAssetResponse.data;

    const toCta = (
      listingId: string,
      listing: Schema["Listing"]["type"] | null | undefined,
      fallbackText: string,
      image?: string,
    ): CtaContent => ({
      href: `/listings/${listingId}`,
      title: listing?.title ?? listingId,
      text: listing?.description || fallbackText,
      image,
    });

    ctaOne = toCta(
      firstListingId,
      firstListing,
      "Featured listing",
      firstAsset?.imageUrls?.[0] ? toPublicStorageUrl(firstAsset.imageUrls[0]) : undefined,
    );
    ctaTwo = {
      ...toCta(
        secondListingId,
        secondListing,
        "Featured listing",
        secondAsset?.imageUrls?.[0] ? toPublicStorageUrl(secondAsset.imageUrls[0]) : undefined,
      ),
      reverse: true,
    };
  }

  return (
    <div className="vertical-stack-with-gap">
      <Hero />
      {ctaOne ? (
        <PhotoCta
          title={ctaOne.title}
          text={ctaOne.text}
          href={ctaOne.href}
          image={ctaOne.image}
        />
      ) : null}
      {ctaTwo ? (
        <PhotoCta
          title={ctaTwo.title}
          text={ctaTwo.text}
          href={ctaTwo.href}
          image={ctaTwo.image}
          reverse
        />
      ) : null}
    </div>
  );
}
