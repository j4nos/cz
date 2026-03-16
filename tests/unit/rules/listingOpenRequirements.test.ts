import { describe, expect, it, vi } from "vitest";

import { getListingOpenRequirementError } from "@/src/application/use-cases/listingOpenRequirements";
import { makeAsset, makeListing, makeProduct } from "@/tests/helpers/factories";

describe("listingOpenRequirements", () => {
  it("does not block listings that are not closed", () => {
    expect(
      getListingOpenRequirementError({
        listing: makeListing({ saleStatus: "open" }),
        asset: makeAsset(),
        products: [makeProduct()],
      }),
    ).toBeUndefined();
  });

  it("requires a valid opening window for closed listings", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-16T12:00:00.000Z"));

    expect(
      getListingOpenRequirementError({
        listing: makeListing({ saleStatus: "closed", startsAt: "2026-03-17", endsAt: "2026-03-20" }),
        asset: makeAsset(),
        products: [makeProduct()],
      }),
    ).toBe("Add a start and end date, and make sure today is between them.");

    vi.useRealTimers();
  });

  it("requires at least one photo", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-16T12:00:00.000Z"));

    expect(
      getListingOpenRequirementError({
        listing: makeListing({ saleStatus: "closed", startsAt: "2026-03-15", endsAt: "2026-03-20" }),
        asset: makeAsset({ imageUrls: [] }),
        products: [makeProduct()],
      }),
    ).toBe("Add at least one photo.");

    vi.useRealTimers();
  });

  it("requires at least one product", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-16T12:00:00.000Z"));

    expect(
      getListingOpenRequirementError({
        listing: makeListing({ saleStatus: "closed", startsAt: "2026-03-15", endsAt: "2026-03-20" }),
        asset: makeAsset(),
        products: [],
      }),
    ).toBe("Add at least one product.");

    vi.useRealTimers();
  });
});