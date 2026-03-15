"use client";

import { useEffect, useState } from "react";

import { Card } from "@/components/ui/Card";
import { AppLink } from "@/components/ui/AppLink";
import { listPublicListings, type PublicListingWithAsset } from "@/src/application/use-cases/publicContent";
import { createPublicContentReader } from "@/src/infrastructure/repositories/createPublicContentReader";

export function Listings({
  basePath = "/listings",
  initialEntries,
}: {
  basePath?: string;
  initialEntries?: PublicListingWithAsset[];
}) {
  const [openListings, setOpenListings] = useState<PublicListingWithAsset[]>(initialEntries ?? []);

  useEffect(() => {
    if (initialEntries) {
      return;
    }

    async function load() {
      setOpenListings(await listPublicListings(createPublicContentReader()));
    }

    void load();
  }, [initialEntries]);

  return (
    <section className="grid">
        {openListings.map((entry) => (
          <div key={entry.listing.id}>
            <Card
              body={`${entry.asset?.name ?? ""} ${entry.listing.currency} ${entry.listing.fromPrice}`.trim()}
              cta={
                <AppLink href={`${basePath}/${entry.listing.id}`} looksLikeButton>
                  View Details
                </AppLink>
              }
              imageSrc={entry.asset?.imageUrls?.[0]}
              title={entry.listing.title}
            />
          </div>
        ))}
      {openListings.length === 0 ? <p className="muted">No listings yet.</p> : null}
    </section>
  );
}
