import { assets, blogPosts, featuredHomepageListings, listings, products, seedOrders, users } from "@/src/ui/mockData";

export function getPublishedBlogPosts() {
  return blogPosts.filter((post) => post.status === "published");
}

export function getBlogPostById(blogId: string) {
  return getPublishedBlogPosts().find((post) => post.id === blogId) ?? null;
}

export function getListingById(listingId: string) {
  return listings.find((listing) => listing.id === listingId) ?? null;
}

export function getAssetById(assetId: string) {
  return assets.find((asset) => asset.id === assetId) ?? null;
}

export function getProductsByListingId(listingId: string) {
  return products.filter((product) => product.listingId === listingId);
}

export function getProductById(productId: string) {
  return products.find((product) => product.id === productId) ?? null;
}

export function getOrdersForInvestor(investorId: string) {
  return seedOrders.filter((order) => order.investorId === investorId);
}

export function getOrdersForProvider(providerId: string) {
  return seedOrders.filter((order) => order.providerUserId === providerId);
}

export function getFeaturedListings() {
  return featuredHomepageListings
    .map((item) => {
      const listing = getListingById(item.listingId);
      const asset = getAssetById(item.assetId);
      if (!listing || !asset) {
        return null;
      }

      return { listing, asset };
    })
    .filter(Boolean);
}

export function getUserByRole(role: "ASSET_PROVIDER" | "INVESTOR") {
  return users.find((user) => user.role === role) ?? null;
}

export function buildOrderSummary(input: {
  listingId: string;
  productId: string;
  quantity: number;
  status: "PENDING_PAYMENT" | "COMPLETED";
}) {
  const listing = getListingById(input.listingId);
  const product = getProductById(input.productId);

  if (!listing || !product) {
    return null;
  }

  return {
    id: `order-${input.productId}-${input.quantity}`,
    listing,
    product,
    quantity: input.quantity,
    total: product.unitPrice * input.quantity,
    status: input.status,
  };
}
