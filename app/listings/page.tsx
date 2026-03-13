import { Listings } from "@/components/listings";
import { listPublicListings } from "@/src/application/publicContent";
import { createPublicContentReader } from "@/src/infrastructure/repositories/createPublicContentReader";

export default async function ListingsPage() {
  const listings = await listPublicListings(createPublicContentReader());
  return <Listings initialEntries={listings} />;
}
