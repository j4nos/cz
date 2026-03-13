# Corresponding Pages And Routes

## Summary

After the rename pass, the `cityzeen-tdd` app structure now mostly follows `cityzeen-app` for shared routes and component names.

Most important result:

- shared page/route names now line up
- shared component names now line up
- previous TDD-only wrapper/client aliases were removed
- the former TDD-only `checkout` and `logout` routes were deleted

## Route Correspondence

### Shared routes with direct functional counterpart

- `app/page.tsx` <-> `app/page.tsx`
- `app/login/page.tsx` <-> `app/login/page.tsx`
- `app/register/page.tsx` <-> `app/register/page.tsx`
- `app/chat/page.tsx` <-> `app/chat/page.tsx`
- `app/blog/page.tsx` <-> `app/blog/page.tsx`
- `app/blog/[blogId]/page.tsx` <-> `app/blog/[blogId]/page.tsx`
- `app/listings/page.tsx` <-> `app/listings/page.tsx`
- `app/listings/[listingId]/page.tsx` <-> `app/listings/[listingId]/page.tsx`
- `app/listings/[listingId]/invest/[productId]/page.tsx` <-> `app/listings/[listingId]/invest/[productId]/page.tsx`
- `app/investor/page.tsx` <-> `app/investor/page.tsx`
- `app/investor/listings/page.tsx` <-> `app/investor/listings/page.tsx`
- `app/investor/listings/[listingId]/page.tsx` <-> `app/investor/listings/[listingId]/page.tsx`
- `app/investor/listings/[listingId]/InvestorListing.tsx` <-> `app/investor/listings/[listingId]/InvestorListing.tsx`
- `app/investor/listings/[listingId]/invest/[productId]/page.tsx` <-> `app/investor/listings/[listingId]/invest/[productId]/page.tsx`
- `app/investor/orders/page.tsx` <-> `app/investor/orders/page.tsx`
- `app/investor/orders/[orderId]/page.tsx` <-> `app/investor/orders/[orderId]/page.tsx`
- `app/investor/orders/[orderId]/InvestorOrder.tsx` <-> `app/investor/orders/[orderId]/InvestorOrder.tsx`
- `app/investor/portfolio/page.tsx` <-> `app/investor/portfolio/page.tsx`
- `app/investor/settings/page.tsx` <-> `app/investor/settings/page.tsx`
- `app/investor/subscriptions/page.tsx` <-> `app/investor/subscriptions/page.tsx`
- `app/investor/kyc/page.tsx` <-> `app/investor/kyc/page.tsx`
- `app/asset-provider/page.tsx` <-> `app/asset-provider/page.tsx`
- `app/asset-provider/assets/page.tsx` <-> `app/asset-provider/assets/page.tsx`
- `app/asset-provider/assets/new/layout.tsx` <-> `app/asset-provider/assets/new/layout.tsx`
- `app/asset-provider/assets/new/step-1/page.tsx` <-> `app/asset-provider/assets/new/step-1/page.tsx`
- `app/asset-provider/assets/new/step-2/page.tsx` <-> `app/asset-provider/assets/new/step-2/page.tsx`
- `app/asset-provider/assets/new/step-3/page.tsx` <-> `app/asset-provider/assets/new/step-3/page.tsx`
- `app/asset-provider/assets/new/step-4/page.tsx` <-> `app/asset-provider/assets/new/step-4/page.tsx`
- `app/asset-provider/assets/[assetId]/page.tsx` <-> `app/asset-provider/assets/[assetId]/page.tsx`
- `app/asset-provider/assets/[assetId]/AssetProviderAsset.tsx` <-> `app/asset-provider/assets/[assetId]/AssetProviderAsset.tsx`
- `app/asset-provider/assets/[assetId]/create/page.tsx` <-> `app/asset-provider/assets/[assetId]/create/page.tsx`
- `app/asset-provider/assets/[assetId]/listings/[listingId]/edit/page.tsx` <-> `app/asset-provider/assets/[assetId]/listings/[listingId]/edit/page.tsx`
- `app/asset-provider/assets/[assetId]/listings/[listingId]/pricing/page.tsx` <-> `app/asset-provider/assets/[assetId]/listings/[listingId]/pricing/page.tsx`
- `app/asset-provider/assets/[assetId]/listings/[listingId]/pricing/Pricing.tsx` <-> `app/asset-provider/assets/[assetId]/listings/[listingId]/pricing/Pricing.tsx`
- `app/asset-provider/assets/[assetId]/listings/[listingId]/pricing/create/page.tsx` <-> `app/asset-provider/assets/[assetId]/listings/[listingId]/pricing/create/page.tsx`
- `app/asset-provider/assets/[assetId]/listings/[listingId]/pricing/product/[productId]/page.tsx` <-> `app/asset-provider/assets/[assetId]/listings/[listingId]/pricing/product/[productId]/page.tsx`
- `app/asset-provider/orders/page.tsx` <-> `app/asset-provider/orders/page.tsx`
- `app/asset-provider/settings/page.tsx` <-> `app/asset-provider/settings/page.tsx`
- `app/platform-admin/blog-posts/page.tsx` <-> `app/platform-admin/blog-posts/page.tsx`
- `app/platform-admin/homepage-cta/page.tsx` <-> `app/platform-admin/homepage-cta/page.tsx`
- `app/settings/page.tsx` <-> `app/settings/page.tsx`
- `app/not-found.tsx` <-> `app/not-found.tsx`
- `app/layout.tsx` <-> `app/layout.tsx`

### Shared API routes with direct counterpart

- `app/api/account/delete/route.ts` <-> `app/api/account/delete/route.ts`
- `app/api/auth/session/route.ts` <-> `app/api/auth/session/route.ts`
- `app/api/chat/route.ts` <-> `app/api/chat/route.ts`
- `app/api/chat/anonymous/route.ts` <-> `app/api/chat/anonymous/route.ts`
- `app/api/chat/claim/route.ts` <-> `app/api/chat/claim/route.ts`
- `app/api/mint-ownership/route.ts` <-> `app/api/mint-ownership/route.ts`
- `app/api/powens/create-payment/route.ts` <-> `app/api/powens/create-payment/route.ts`
- `app/api/powens/payment-status/route.ts` <-> `app/api/powens/payment-status/route.ts`
- `app/api/powens/webhook/route.ts` <-> `app/api/powens/webhook/route.ts`
- `app/api/tokenize-asset/route.ts` <-> `app/api/tokenize-asset/route.ts`

## Component Correspondence

### Shared component names now aligned

- `components/Invest.tsx` <-> `components/Invest.tsx`
- `components/CreateEditListing.tsx` <-> `components/CreateEditListing.tsx`
- `components/PricingEditor.tsx` <-> `components/PricingEditor.tsx`
- `components/listing.tsx` <-> `components/listing.tsx`
- `components/listings.tsx` <-> `components/listings.tsx`
- `components/WithdrawPopup.tsx` <-> `components/WithdrawPopup.tsx`
- `components/layout/AppShell.tsx` <-> `components/layout/AppShell.tsx`
- `components/footer/Footer.tsx` <-> `components/footer/Footer.tsx`
- `components/navigation/Navbar.tsx` <-> `components/navigation/Navbar.tsx`
- `components/navigation/StepNavigation.tsx` <-> `components/navigation/StepNavigation.tsx`
- `components/sections/Hero.tsx` <-> `components/sections/Hero.tsx`
- `components/sections/PhotoCta.tsx` <-> `components/sections/PhotoCta.tsx`
- `components/sections/PlainCta.tsx` <-> `components/sections/PlainCta.tsx`
- `components/sections/SectionContainer.tsx` <-> `components/sections/SectionContainer.tsx`
- `components/blog/BlogDetails.tsx` <-> `components/blog/BlogDetails.tsx`
- `components/blog/BlogList.tsx` <-> `components/blog/BlogList.tsx`
- `components/chat/ChatLauncher.tsx` <-> `components/chat/ChatLauncher.tsx`
- `components/chat/ChatPanel.tsx` <-> `components/chat/ChatPanel.tsx`
- `components/platform-admin/BlogPostForm.tsx` <-> `components/platform-admin/BlogPostForm.tsx`
- `components/platform-admin/BlogPostsTable.tsx` <-> `components/platform-admin/BlogPostsTable.tsx`
- `components/toast/Toast.tsx` <-> `components/toast/Toast.tsx`
- `components/ui/AppLink.tsx` <-> `components/ui/AppLink.tsx`
- `components/ui/Badge.tsx` <-> `components/ui/Badge.tsx`
- `components/ui/Button.tsx` <-> `components/ui/Button.tsx`
- `components/ui/Card.tsx` <-> `components/ui/Card.tsx`
- `components/ui/Carousel.tsx` <-> `components/ui/Carousel.tsx`
- `components/ui/Form.tsx` <-> `components/ui/Form.tsx`
- `components/ui/KeyValueList.tsx` <-> `components/ui/KeyValueList.tsx`
- `components/ui/Popup.tsx` <-> `components/ui/Popup.tsx`
- `components/ui/Table.tsx` <-> `components/ui/Table.tsx`

## Notes On Implementation Boundary

The remaining internal difference is architectural, not route naming:

- `cityzeen-app` uses `useData` / app-side data access
- `cityzeen-tdd` still uses the `src/application` and `src/infrastructure` controller boundary

The page names, component names, and route semantics were aligned even where the internal data path differs.

## App-only files still missing from TDD

These are the main gaps still visible in the current tree:

- `app/forgot-password/page.tsx`
- `app/gdpr/page.tsx`
- `app/privacy/page.tsx`
- `app/menu/page.tsx`
- `app/ui-catalog/page.tsx`
- `app/global-error.tsx`
- `app/asset-provider/assets/[assetId]/due-diligence/[runId]/DueDiligence.tsx`
- `app/api/chat/route.test.ts`
- `app/api/tokenize-asset/route.test.ts`
- `components/WithdrawPopup.test.tsx`
- `components/navigation/StepNavigation.test.tsx`
- `components/ui/Carousel.test.tsx`
- `components/ui/Popup.test.tsx`

## Notes On What Was Cleaned Up

These former TDD-only naming layers were removed or folded back into app-style names:

- `ListingPageClient`
  - folded into `components/listing.tsx`
- `AssetProviderAssetsPageClient`
  - folded into `app/asset-provider/assets/page.tsx`
- `AssetProviderOrdersClient`
  - folded into `app/asset-provider/orders/page.tsx`
- `SettingsForm`
  - folded into the two settings page files
- `InvestorKycClient`
  - folded into `app/investor/kyc/page.tsx`
- `BlogPostsClient`
  - folded into `app/platform-admin/blog-posts/page.tsx`
- `InvestorOrderClient`
  - folded into `app/investor/orders/[orderId]/InvestorOrder.tsx`
- flat aliases like `components/hero.tsx`, `components/photo-cta.tsx`, `components/navbar.tsx`, `components/footer.tsx`, `components/SectionContainer.tsx`
  - removed in favor of the `app`-style folder structure

## Current Assessment

The TDD tree is now mostly aligned with the `app` tree for naming and route/component placement.

What still sticks out is mostly one of these:

- app-only product/support/demo routes not yet ported: `forgot-password`, `gdpr`, `privacy`, `menu`, `ui-catalog`
- implementation-level differences behind the same filenames, mainly because TDD still uses the `src/application` and `src/infrastructure` boundary
