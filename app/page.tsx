import Link from "next/link";

import { Listings } from "@/components/listings";
import { getFeaturedListings } from "@/src/ui/queries";

export default function HomePage() {
  const featured = getFeaturedListings().filter((item): item is NonNullable<typeof item> => item !== null);
  const heroImageUrl = featured[0]?.asset?.imageUrls?.[0];

  return (
    <>
      <section>
        <div>
          {heroImageUrl ? <img alt="Real estate hero" src={heroImageUrl} /> : <div>Featured image unavailable.</div>}
        </div>
        <div>
          <h2>Direct investment flow, kept deliberately basic.</h2>
          <p>Use the seeded demo data to go from public listing to fake payment confirmation.</p>
          <Link href="/listings">Browse listings</Link> <Link href="/register">Register</Link>
        </div>
      </section>
      <section>
        <h2>Featured listings</h2>
        {featured.map((item) => (
          <article key={item.listing.id}>
            {item.asset?.imageUrls?.[0] ? <img alt={item.asset.name} src={item.asset.imageUrls[0]} /> : <div>No image</div>}
            <h3>{item.listing.title}</h3>
            <Link href={`/listings/${item.listing.id}`}>Open listing</Link>
          </article>
        ))}
      </section>
      <Listings />
    </>
  );
}
