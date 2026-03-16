import { describe, expect, it, vi } from "vitest";

import {
  getInvestorOrderEntry,
  getPublicListingDetails,
  listPublicBlogPosts,
  listPublicListings,
  type PublicContentReader,
} from "@/src/application/use-cases/publicContent";
import { makeAsset, makeBlogPost, makeListing, makeOrder, makeProduct } from "@/tests/helpers/factories";

function makeReader(overrides: Partial<PublicContentReader> = {}): PublicContentReader {
  return {
    listOpenListingsWithAssets: vi.fn().mockResolvedValue([{ listing: makeListing(), asset: makeAsset() }]),
    getListingWithAssetById: vi.fn().mockResolvedValue({ listing: makeListing(), asset: makeAsset() }),
    getOpenListingWithAssetById: vi.fn().mockResolvedValue({ listing: makeListing(), asset: makeAsset() }),
    listProductsByListingId: vi.fn().mockResolvedValue([makeProduct()]),
    getProductById: vi.fn().mockResolvedValue(makeProduct()),
    getOrderById: vi.fn().mockResolvedValue(makeOrder()),
    listPublishedBlogPosts: vi.fn().mockResolvedValue([makeBlogPost()]),
    getPublishedBlogPostById: vi.fn().mockResolvedValue(makeBlogPost()),
    ...overrides,
  };
}

describe("publicContent", () => {
  it("returns empty products when the public listing is missing", async () => {
    const reader = makeReader({ getOpenListingWithAssetById: vi.fn().mockResolvedValue(null) });

    await expect(getPublicListingDetails(reader, "listing-1")).resolves.toEqual({ listingWithAsset: null, products: [] });
  });

  it("returns null order entry parts when the order is missing", async () => {
    const reader = makeReader({ getOrderById: vi.fn().mockResolvedValue(null) });

    await expect(getInvestorOrderEntry(reader, "order-1")).resolves.toEqual({
      order: null,
      listingWithAsset: null,
      product: null,
    });
  });

  it("resolves listing and product for a known investor order", async () => {
    const reader = makeReader();

    const result = await getInvestorOrderEntry(reader, "order-1");

    expect(result.order?.id).toBe("order-1");
    expect(result.listingWithAsset?.listing.id).toBe("listing-1");
    expect(result.product?.id).toBe("product-1");
  });

  it("lists public listings and blog posts through the reader", async () => {
    const reader = makeReader();

    await expect(listPublicListings(reader)).resolves.toHaveLength(1);
    await expect(listPublicBlogPosts(reader)).resolves.toEqual([makeBlogPost()]);
  });
});