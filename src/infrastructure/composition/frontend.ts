"use client";

import { AccountSettingsService } from "@/src/application/use-cases/accountSettingsService";
import { BlogPostAdminService } from "@/src/application/use-cases/blogPostAdminService";
import { ChatPanelService } from "@/src/application/use-cases/chatPanelService";
import { CheckoutService } from "@/src/application/use-cases/checkoutService";
import { ListingDraftService } from "@/src/application/use-cases/listingDraftService";
import { OwnershipMintingService } from "@/src/application/use-cases/ownershipMintingService";
import { ProductPricingService } from "@/src/application/use-cases/productPricingService";
import { SaveAssetDraftService } from "@/src/application/use-cases/saveAssetDraftService";
import type { AssetPort } from "@/src/application/interfaces/assetPort";
import type { ReadPort } from "@/src/application/interfaces/readPort";
import type { Schema } from "@/amplify/data/resource";
import { generateClient } from "aws-amplify/data";
import { uploadData } from "aws-amplify/storage";
import { ensureAmplifyConfigured } from "@/src/config/amplify";
import type { Asset, Order, Product } from "@/src/domain/entities";
import { createAuthClient } from "@/src/infrastructure/auth/createAuthClient";
import { createChatPanelClient } from "@/src/infrastructure/chat/chatPanelClient";
import { createInvestmentPlatformService, createInvestmentRepository } from "@/src/infrastructure/composition/defaults";
import { createAssetController } from "@/src/infrastructure/controllers/createAssetController";
import { createReadController } from "@/src/infrastructure/controllers/createReadController";
import { deleteCurrentAccount } from "@/src/infrastructure/http/accountClient";
import { previewCoupon } from "@/src/infrastructure/http/couponPreviewClient";
import { revalidateListings } from "@/src/infrastructure/http/listingRevalidationClient";
import { createPowensBankTransferPayment, fetchPowensPaymentStatus } from "@/src/infrastructure/http/powensPaymentClient";
import { requestOwnershipMint } from "@/src/infrastructure/http/ownershipMintingClient";
import { mergeAssetImagePaths } from "@/src/infrastructure/storage/mergeAssetImagePaths";
import {
  assetImagePrefix,
  assetDocPrefix,
  blogCoverPrefix,
  normalizeStoredPublicPath,
  toSafeFileName,
} from "@/src/infrastructure/storage/publicUrls";

export function createCheckoutService() {
  const repository = createInvestmentRepository();
  return new CheckoutService(
    repository,
    createInvestmentPlatformService(repository),
    createAuthClient(),
    createPowensBankTransferPayment,
  );
}

export function createOwnershipMintingService() {
  return new OwnershipMintingService(createInvestmentRepository(), requestOwnershipMint);
}

export function createReadPort(): ReadPort {
  return createReadController();
}

export function createAssetPort(): AssetPort {
  return createAssetController();
}

export function previewCouponRequest(input: Parameters<typeof previewCoupon>[0]) {
  return previewCoupon(input);
}

export function revalidateListingEntries(input: Parameters<typeof revalidateListings>[0]) {
  return revalidateListings(input);
}

export function fetchPowensPaymentStatusClient(input: Parameters<typeof fetchPowensPaymentStatus>[0]) {
  return fetchPowensPaymentStatus(input);
}

export async function revalidateHomepage(accessToken?: string | null): Promise<void> {
  const response = await fetch("/api/platform-admin/revalidate-homepage", {
    method: "POST",
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
  });

  if (!response.ok) {
    const result = (await response.json().catch(() => ({}))) as { message?: string };
    throw new Error(result.message || "Failed to revalidate homepage.");
  }
}

export function createAccountSettingsService() {
  return new AccountSettingsService(createAuthClient(), deleteCurrentAccount);
}

export function createSaveAssetDraftService() {
  return new SaveAssetDraftService(createInvestmentRepository());
}

export function createListingDraftService() {
  const repository = createInvestmentRepository();
  return new ListingDraftService(repository, createInvestmentPlatformService(repository));
}

export function createProductPricingService() {
  return new ProductPricingService(createInvestmentRepository());
}

export function createAssetProviderOrdersFacade() {
  const readPort = createReadPort();
  const investmentPlatformService = createInvestmentPlatformService();
  const ownershipMintingService = createOwnershipMintingService();

  return {
    async listOrdersByProvider(providerUserId: string): Promise<{
      orders: Order[];
      productsById: Record<string, Product>;
    }> {
      const orders = await readPort.listOrdersByProvider(providerUserId);
      orders.sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime());

      const uniqueProductIds = Array.from(new Set(orders.map((order) => order.productId)));
      const productEntries = await Promise.all(
        uniqueProductIds.map(async (productId) => [productId, await readPort.getProductById(productId)] as const),
      );

      return {
        orders,
        productsById: Object.fromEntries(
          productEntries.filter((entry): entry is [string, Product] => Boolean(entry[1])),
        ),
      };
    },
    async completePaymentAndMint(input: { orderId: string; accessToken?: string | null }) {
      const currentOrder = await readPort.getOrderById(input.orderId);
      if (!currentOrder) {
        return { paidOrder: null, mintResult: null };
      }

      const paidOrder = await investmentPlatformService.completeOrderPayment({
        orderId: currentOrder.id,
      });
      const mintResult = await ownershipMintingService.mint({
        order: paidOrder,
        accessToken: input.accessToken,
      });

      return { paidOrder, mintResult };
    },
  };
}

export function createListingEditorFacade() {
  const readPort = createReadPort();
  const listingDraftService = createListingDraftService();

  return {
    getAssetById(assetId: string) {
      return readPort.getAssetById(assetId);
    },
    getListingById(listingId: string) {
      return readPort.getListingById(listingId);
    },
    listProductsByListingId(listingId: string) {
      return readPort.listProductsByListingId(listingId);
    },
    async saveListingDraft(input: { listing: Parameters<ListingDraftService["saveListingDraft"]>[0]; accessToken?: string | null }) {
      const saved = await listingDraftService.saveListingDraft(input.listing);
      await revalidateListingEntries({ accessToken: input.accessToken, listingId: saved.id });
      return saved;
    },
    async createListingDraft(input: Parameters<ListingDraftService["createListingDraft"]>[0] & { accessToken?: string | null }) {
      const created = await listingDraftService.createListingDraft(input);
      await revalidateListingEntries({ accessToken: input.accessToken, listingId: created.id });
      return created;
    },
    async deleteListing(input: { listingId: string; accessToken?: string | null }) {
      await listingDraftService.deleteListing(input.listingId);
      await revalidateListingEntries({ accessToken: input.accessToken, listingId: input.listingId });
    },
    async removeProduct(productId: string) {
      await listingDraftService.removeProduct(productId);
    },
  };
}

export function createProductPricingFacade() {
  const productPricingService = createProductPricingService();

  return {
    loadPricingState: productPricingService.loadPricingState.bind(productPricingService),
    async savePricingState(input: {
      state: Parameters<ProductPricingService["savePricingState"]>[0];
      listingId: string;
      accessToken?: string | null;
    }) {
      const saved = await productPricingService.savePricingState(input.state);
      await revalidateListingEntries({ accessToken: input.accessToken, listingId: input.listingId });
      return saved;
    },
    deleteProduct: productPricingService.deleteProduct.bind(productPricingService),
  };
}

export async function uploadAssetPhotos(input: { asset: Asset; files: File[] }): Promise<Asset> {
  ensureAmplifyConfigured();
  const client = generateClient<Schema>();
  const startIndex = input.asset.imageUrls.length + 1;

  const uploadedPaths = await Promise.all(
    input.files.map(async (file, offset) => {
      const fileName = `${Date.now()}-${startIndex + offset}-${toSafeFileName(file.name)}`;
      const path = `${assetImagePrefix(input.asset.id)}${fileName}`;
      await uploadData({
        path,
        data: file,
        options: {
          contentType: file.type || undefined,
        },
      }).result;
      return path;
    }),
  );

  const merged = mergeAssetImagePaths({
    asset: input.asset,
    uploadedPaths,
  });

  const response = await client.models.Asset.update({
    id: input.asset.id,
    imageUrls: merged.storedPaths,
  });
  if (!response.data) {
    throw new Error(response.errors?.[0]?.message || "Failed to update asset photos.");
  }

  return {
    ...input.asset,
    imageUrls: merged.publicUrls,
  };
}

export async function appendAssetImages(input: { assetId: string; files: File[] }): Promise<string[]> {
  ensureAmplifyConfigured();
  const uploadedPaths = await Promise.all(
    input.files.map(async (file, index) => {
      const fileName = `${Date.now()}-${index}-${toSafeFileName(file.name)}`;
      const path = `${assetImagePrefix(input.assetId)}${fileName}`;
      await uploadData({
        path,
        data: file,
        options: {
          contentType: file.type || undefined,
        },
      }).result;
      return path;
    }),
  );

  const client = generateClient<Schema>();
  const existingAsset = await client.models.Asset.get({ id: input.assetId });
  const existingImages = Array.isArray(existingAsset.data?.imageUrls)
    ? existingAsset.data.imageUrls.filter((value): value is string => typeof value === "string")
    : [];
  const nextImages = Array.from(
    new Set([...existingImages.map(normalizeStoredPublicPath), ...uploadedPaths]),
  );
  const response = await client.models.Asset.update({
    id: input.assetId,
    imageUrls: nextImages,
  });

  if (!response.data) {
    throw new Error(response.errors?.[0]?.message || "Failed to update asset images.");
  }

  return uploadedPaths;
}

export async function uploadAssetDocument(input: {
  assetId: string;
  uploadedByUserId: string;
  type: string;
  file: File;
}): Promise<void> {
  ensureAmplifyConfigured();

  const fileName = `${Date.now()}-${toSafeFileName(input.file.name)}`;
  const path = `${assetDocPrefix(input.assetId)}${fileName}`;
  await uploadData({
    path,
    data: input.file,
    options: {
      contentType: input.file.type || undefined,
    },
  }).result;

  const client = generateClient<Schema>();
  const response = await client.models.DocumentMeta.create({
    assetId: input.assetId,
    uploadedByUserId: input.uploadedByUserId,
    type: input.type,
    name: input.file.name,
    status: "uploaded",
    createdAt: new Date().toISOString(),
  });

  if (!response.data) {
    throw new Error(response.errors?.[0]?.message || "Failed to save document metadata.");
  }
}

export type HomepageSettingsForm = {
  firstAssetId: string;
  firstListingId: string;
  secondAssetId: string;
  secondListingId: string;
};

export function createHomepageSettingsFacade() {
  ensureAmplifyConfigured();
  const client = generateClient<Schema>();

  return {
    async load(): Promise<HomepageSettingsForm> {
      const { data } = await client.models.PlatformSettings.get(
        { id: "homepage" },
        { authMode: "userPool" },
      );

      return {
        firstAssetId: data?.homepageFirstAssetId ?? "",
        firstListingId: data?.homepageFirstListingId ?? "",
        secondAssetId: data?.homepageSecondAssetId ?? "",
        secondListingId: data?.homepageSecondListingId ?? "",
      };
    },
    async save(input: HomepageSettingsForm & { updatedByUserId: string; accessToken?: string | null }) {
      const existing = await client.models.PlatformSettings.get(
        { id: "homepage" },
        { authMode: "userPool" },
      );
      const payload = {
        id: "homepage",
        homepageFirstAssetId: input.firstAssetId,
        homepageFirstListingId: input.firstListingId,
        homepageSecondAssetId: input.secondAssetId,
        homepageSecondListingId: input.secondListingId,
        updatedByUserId: input.updatedByUserId,
        updatedAt: new Date().toISOString(),
      };

      const response = existing.data
        ? await client.models.PlatformSettings.update(payload, { authMode: "userPool" })
        : await client.models.PlatformSettings.create(payload, { authMode: "userPool" });

      if (!response.data) {
        throw new Error(response.errors?.[0]?.message || "Failed to save homepage CTA settings.");
      }

      await revalidateHomepage(input.accessToken);
      return response.data;
    },
  };
}

export type DueDiligenceRunView = {
  id: string;
  status: string;
  riskScore?: number;
  executedAt?: string;
  ready: boolean;
  missingSummary?: string;
};

export async function getDueDiligenceRun(runId: string): Promise<DueDiligenceRunView | null> {
  ensureAmplifyConfigured();
  const client = generateClient<Schema>();
  const response = await client.models.DueDiligenceRun.get({ id: runId });
  if (!response.data) {
    return null;
  }

  return {
    id: response.data.id,
    status: response.data.status ?? "",
    riskScore: response.data.riskScore == null ? undefined : Number(response.data.riskScore),
    executedAt: response.data.executedAt ?? undefined,
    ready: Boolean(response.data.ready),
    missingSummary: response.data.missingSummary ?? undefined,
  };
}

export function createBlogPostAdminService() {
  return new BlogPostAdminService(createInvestmentRepository(), async ({ postId, file }) => {
    ensureAmplifyConfigured();
    const client = generateClient<Schema>();
    const fileName = `${Date.now()}-${toSafeFileName(file.name)}`;
    const path = `${blogCoverPrefix(postId)}${fileName}`;
    await uploadData({
      path,
      data: file,
      options: {
        contentType: file.type || undefined,
      },
    }).result;
    const response = await client.models.BlogPost.update(
      {
        id: postId,
        coverImage: path,
      },
      { authMode: "userPool" },
    );
    if (!response.data) {
      throw new Error(response.errors?.[0]?.message || "Failed to update blog cover image.");
    }
    return path;
  });
}

export function createChatPanelService() {
  return new ChatPanelService(createChatPanelClient());
}
