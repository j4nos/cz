import { Listings } from "@/components/listings";
import { listPublicListings } from "@/src/application/use-cases/publicContent";
import { createPublicContentReader } from "@/src/presentation/composition/server";

export default async function ListingsPage() {
  const listings = await listPublicListings(createPublicContentReader());
  return <Listings initialEntries={listings} />;
}
