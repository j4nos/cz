import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

const schema = a.schema({
  UserProfile: a
    .model({
      email: a.string().required(),
      role: a.string().required(),
      country: a.string().required(),
      investorType: a.string(),
      companyName: a.string(),
      kycStatus: a.string().required(),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
      assets: a.hasMany("Asset", "tenantUserId"),
      investorOrders: a.hasMany("Order", "investorId"),
      providerOrders: a.hasMany("Order", "providerUserId"),
      subscriptions: a.hasMany("UserSubscription", "investorId"),
      messages: a.hasMany("UserMessage", "userId"),
      documentUploads: a.hasMany("DocumentMeta", "uploadedByUserId"),
      threads: a.hasMany("UserThread", "userId"),
    })
    .authorization((allow) => [allow.publicApiKey()]),

  UserThread: a
    .model({
      userId: a.id().required(),
      lastMessageAt: a.datetime(),
      lastMessageText: a.string(),
      state: a.string().required(),
      user: a.belongsTo("UserProfile", "userId"),
      messages: a.hasMany("UserMessage", "threadId"),
    })
    .authorization((allow) => [allow.publicApiKey()]),

  UserMessage: a
    .model({
      threadId: a.id().required(),
      userId: a.id().required(),
      role: a.string().required(),
      text: a.string().required(),
      createdAt: a.datetime(),
      thread: a.belongsTo("UserThread", "threadId"),
      user: a.belongsTo("UserProfile", "userId"),
    })
    .authorization((allow) => [allow.publicApiKey()]),

  Asset: a
    .model({
      tenantUserId: a.id().required(),
      name: a.string().required(),
      country: a.string().required(),
      assetClass: a.string().required(),
      tokenStandard: a.string(),
      status: a.string().required(),
      missingDocsCount: a.integer().required(),
      tokenAddress: a.string(),
      latestRunId: a.id(),
      imageUrls: a.string().array(),
      beneficiaryIban: a.string(),
      beneficiaryLabel: a.string(),
      tenantUser: a.belongsTo("UserProfile", "tenantUserId"),
      listings: a.hasMany("Listing", "assetId"),
      documents: a.hasMany("DocumentMeta", "assetId"),
      dueDiligenceRuns: a.hasMany("DueDiligenceRun", "assetId"),
      contractDeploymentRequests: a.hasMany("ContractDeploymentRequest", "assetId"),
    })
    .authorization((allow) => [allow.publicApiKey()]),

  Listing: a
    .model({
      assetId: a.id().required(),
      title: a.string().required(),
      description: a.string(),
      assetClass: a.string().required(),
      eligibility: a.string().required(),
      currency: a.string().required(),
      fromPrice: a.float().required(),
      saleStatus: a.string().required(),
      saleStartDate: a.string(),
      saleEndDate: a.string(),
      imageUrls: a.string().array(),
      asset: a.belongsTo("Asset", "assetId"),
      products: a.hasMany("Product", "listingId"),
      orders: a.hasMany("Order", "listingId"),
    })
    .authorization((allow) => [allow.publicApiKey()]),

  Product: a
    .model({
      listingId: a.id().required(),
      name: a.string().required(),
      currency: a.string().required(),
      unitPrice: a.float().required(),
      minPurchase: a.integer().required(),
      maxPurchase: a.integer().required(),
      eligibleInvestorType: a.string().required(),
      supplyTotal: a.integer().required(),
      remainingSupply: a.integer().required(),
      listing: a.belongsTo("Listing", "listingId"),
      pricingTiers: a.hasMany("PricingTier", "productId"),
      orders: a.hasMany("Order", "productId"),
    })
    .authorization((allow) => [allow.publicApiKey()]),

  PricingTier: a
    .model({
      productId: a.id().required(),
      minQty: a.integer().required(),
      discountedUnitPrice: a.float().required(),
      product: a.belongsTo("Product", "productId"),
    })
    .authorization((allow) => [allow.publicApiKey()]),

  Order: a
    .model({
      investorId: a.id().required(),
      providerUserId: a.id().required(),
      listingId: a.id().required(),
      productId: a.id().required(),
      productName: a.string(),
      quantity: a.integer().required(),
      unitPrice: a.float().required(),
      baseUnitPrice: a.float(),
      discountPctApplied: a.float(),
      effectiveUnitPrice: a.float(),
      description: a.string(),
      total: a.float().required(),
      status: a.string().required(),
      currency: a.string().required(),
      paymentProvider: a.string(),
      paymentProviderId: a.string(),
      paymentProviderStatus: a.string(),
      coupon: a.string(),
      requiresProviderConfirmation: a.boolean(),
      createdAt: a.datetime(),
      withdrawnAt: a.datetime(),
      providerConfirmedBy: a.string(),
      providerConfirmedAt: a.datetime(),
      investorWalletAddress: a.string(),
      mintRequestedAt: a.datetime(),
      mintingAt: a.datetime(),
      mintTxHash: a.string(),
      mintError: a.string(),
      mintedAt: a.datetime(),
      investor: a.belongsTo("UserProfile", "investorId"),
      providerUser: a.belongsTo("UserProfile", "providerUserId"),
      listing: a.belongsTo("Listing", "listingId"),
      product: a.belongsTo("Product", "productId"),
      mintRequests: a.hasMany("MintRequest", "orderId"),
    })
    .authorization((allow) => [allow.publicApiKey()]),

  ContractDeploymentRequest: a
    .model({
      assetId: a.id().required(),
      idempotencyKey: a.string().required(),
      deploymentStatus: a.string().required(),
      runId: a.string().required(),
      tokenStandard: a.string(),
      tokenAddress: a.string(),
      errorCode: a.string(),
      errorMessage: a.string(),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
      asset: a.belongsTo("Asset", "assetId"),
    })
    .authorization((allow) => [allow.publicApiKey()]),

  MintRequest: a
    .model({
      orderId: a.id().required(),
      assetId: a.id().required(),
      idempotencyKey: a.string().required(),
      mintStatus: a.string().required(),
      walletAddress: a.string(),
      blockchainTxHash: a.string(),
      tokenId: a.string(),
      retryCount: a.integer(),
      errorCode: a.string(),
      errorMessage: a.string(),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
      order: a.belongsTo("Order", "orderId"),
    })
    .authorization((allow) => [allow.publicApiKey()]),

  DocumentMeta: a
    .model({
      assetId: a.id().required(),
      uploadedByUserId: a.id().required(),
      type: a.string().required(),
      name: a.string().required(),
      status: a.string().required(),
      createdAt: a.datetime(),
      asset: a.belongsTo("Asset", "assetId"),
      uploadedByUser: a.belongsTo("UserProfile", "uploadedByUserId"),
    })
    .authorization((allow) => [allow.publicApiKey()]),

  DueDiligenceRun: a
    .model({
      assetId: a.id().required(),
      status: a.string().required(),
      executedAt: a.datetime(),
      riskScore: a.float(),
      ready: a.boolean().required(),
      missingSummary: a.string(),
      asset: a.belongsTo("Asset", "assetId"),
    })
    .authorization((allow) => [allow.publicApiKey()]),

  UserSubscription: a
    .model({
      investorId: a.id().required(),
      plan: a.string().required(),
      status: a.string().required(),
      price: a.float().required(),
      investor: a.belongsTo("UserProfile", "investorId"),
    })
    .authorization((allow) => [allow.publicApiKey()]),

  PlatformSettings: a
    .model({
      homepageFirstAssetId: a.id(),
      homepageFirstListingId: a.id(),
      homepageSecondAssetId: a.id(),
      homepageSecondListingId: a.id(),
      updatedByUserId: a.id().required(),
      updatedAt: a.datetime(),
    })
    .authorization((allow) => [allow.publicApiKey()]),

  BlogPost: a
    .model({
      title: a.string().required(),
      excerpt: a.string(),
      coverImage: a.string(),
      contentHtml: a.string(),
      status: a.string().required(),
      publishedAt: a.datetime(),
      updatedAt: a.datetime(),
    })
    .authorization((allow) => [allow.publicApiKey()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "apiKey",
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});
