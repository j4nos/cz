import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";

import outputs from "../amplify_outputs.json";
import type { Schema } from "../amplify/data/resource";
import {
  demoAssets as assets,
  demoBlogPosts as blogPosts,
  demoListings as listings,
  demoProducts as products,
  demoSeedOrders as seedOrders,
  demoUsers as users,
} from "../src/seed/demoData";

Amplify.configure(outputs, { ssr: true });

const client = generateClient<Schema>();

async function upsertUserProfiles() {
  for (const user of users) {
    const existing = await client.models.UserProfile.get({ id: user.id });
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      country: user.country,
      investorType: user.investorType,
      companyName: user.companyName,
      kycStatus: user.kycStatus,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    if (existing.data) {
      await client.models.UserProfile.update(payload);
    } else {
      await client.models.UserProfile.create(payload);
    }
  }
}

async function upsertAssets() {
  for (const asset of assets) {
    const existing = await client.models.Asset.get({ id: asset.id });
    const payload = {
      id: asset.id,
      tenantUserId: asset.tenantUserId,
      name: asset.name,
      country: asset.country,
      assetClass: asset.assetClass,
      tokenStandard: asset.tokenStandard,
      status: asset.status,
      missingDocsCount: asset.missingDocsCount,
      tokenAddress: asset.tokenAddress,
      latestRunId: asset.latestRunId,
      imageUrls: asset.imageUrls,
    };

    if (existing.data) {
      await client.models.Asset.update(payload);
    } else {
      await client.models.Asset.create(payload);
    }
  }
}

async function upsertListings() {
  for (const listing of listings) {
    const existing = await client.models.Listing.get({ id: listing.id });
    const payload = {
      id: listing.id,
      assetId: listing.assetId,
      title: listing.title,
      description: listing.description,
      assetClass: listing.assetClass,
      eligibility: listing.eligibility,
      currency: listing.currency,
      fromPrice: listing.fromPrice,
      saleStatus: listing.saleStatus,
      saleStartDate: listing.startsAt,
      saleEndDate: listing.endsAt,
      imageUrls: listing.imageUrls,
    };

    if (existing.data) {
      await client.models.Listing.update(payload);
    } else {
      await client.models.Listing.create(payload);
    }
  }
}

async function upsertProducts() {
  for (const product of products) {
    const existing = await client.models.Product.get({ id: product.id });
    const payload = {
      id: product.id,
      listingId: product.listingId,
      name: product.name,
      currency: product.currency,
      unitPrice: product.unitPrice,
      minPurchase: product.minPurchase,
      maxPurchase: product.maxPurchase,
      eligibleInvestorType: product.eligibleInvestorType,
      supplyTotal: product.supplyTotal,
      remainingSupply: product.remainingSupply,
    };

    if (existing.data) {
      await client.models.Product.update(payload);
    } else {
      await client.models.Product.create(payload);
    }
  }
}

async function upsertOrders() {
  for (const order of seedOrders) {
    const existing = await client.models.Order.get({ id: order.id });
    const payload = {
      id: order.id,
      investorId: order.investorId,
      providerUserId: order.providerUserId,
      listingId: order.listingId,
      productId: order.productId,
      quantity: order.quantity,
      unitPrice: order.unitPrice,
      total: order.total,
      status: order.status,
      currency: order.currency,
      investorWalletAddress: order.investorWalletAddress,
    };

    if (existing.data) {
      await client.models.Order.update(payload);
    } else {
      await client.models.Order.create(payload);
    }
  }
}

async function upsertBlogPosts() {
  for (const post of blogPosts) {
    const existing = await client.models.BlogPost.get({ id: post.id });
    const payload = {
      id: post.id,
      title: post.title,
      excerpt: post.excerpt,
      coverImage: post.coverImage,
      contentHtml: post.contentHtml,
      status: post.status,
      publishedAt: post.publishedAt,
      updatedAt: post.updatedAt,
    };

    if (existing.data) {
      await client.models.BlogPost.update(payload);
    } else {
      await client.models.BlogPost.create(payload);
    }
  }
}

async function main() {
  await upsertUserProfiles();
  await upsertAssets();
  await upsertListings();
  await upsertProducts();
  await upsertOrders();
  await upsertBlogPosts();

  console.log(
    JSON.stringify(
      {
        seeded: {
          users: users.length,
          assets: assets.length,
          listings: listings.length,
          products: products.length,
          orders: seedOrders.length,
          blogPosts: blogPosts.length,
        },
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
