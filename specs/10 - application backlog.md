# Application Backlog

## Goal

Move business logic and workflow decisions out of UI components and pages into `src/application`.

This document lists the highest-value candidates, with proposed use case names, likely inputs/outputs, and the current UI files that should stop owning the logic.

## P1

### 1. Checkout / payment flow

Current UI owners:

- `components/Invest.tsx`
- `components/listing.tsx`

Current UI logic:

- payment type availability
- Powens / bank transfer eligibility
- login gate before placing order
- product/quantity defaults
- deciding between order creation and Powens redirect flow

Proposed application file:

- `src/application/checkoutFlow.ts`

Proposed use cases:

- `getAvailablePaymentMethods(input)`
- `createCheckoutDraft(input)`
- `startCheckout(input)`

Suggested input shape:

- `listing`
- `asset`
- `product`
- `quantity`
- `investor`
- `accessTokenAvailable`

Suggested output shape:

- `allowedPaymentMethods: string[]`
- `defaultPaymentMethod: string`
- `error?: string`
- `orderId?: string`
- `redirectUrl?: string`

Why:

- this is currently the most important business workflow still centered in UI

### 2. Asset submission flow

Current UI owner:

- `app/asset-provider/assets/new/step-4/page.tsx`

Current UI logic:

- missing data checks
- token standard fallback
- token symbol generation
- deploy-token-or-reuse-existing decision
- asset status transition to `submitted`

Proposed application file:

- `src/application/contractDeployment.ts`

Proposed use cases:

- `getContractDeploymentError(input)`
- `deployAssetContract(input)`

Suggested input shape:

- `asset`
- `wizardState`
- `activeUser`
- `accessToken`

Suggested output shape:

- `error?: string`
- `needsTokenDeployment: boolean`
- `submittedAsset?: Asset`
- `redirectTo?: string`

Why:

- this is a full workflow, not component logic

### 3. Withdrawal / mint request flow

Current UI owners:

- `app/investor/portfolio/page.tsx`
- `app/asset-provider/orders/page.tsx`

Current UI logic:

- token address resolution
- token standard fallback
- wallet checks
- mint trigger payload creation
- result status interpretation

Proposed application file:

- `src/application/ownershipMinting.ts`

Proposed use cases:

- `prepareMintOwnershipRequest(input)`
- `requestWithdrawalMint(input)`

Suggested input shape:

- `order`
- `listing`
- `asset`
- `walletAddress`
- `accessToken`

Suggested output shape:

- `error?: string`
- `requestBody?: object`
- `successMessage?: string`

Why:

- currently duplicated, page-specific orchestration

## P2

### 4. Listing edit flow

Current UI owner:

- `components/CreateEditListing.tsx`

Already improved:

- open-requirement validation moved to application:
  - `src/application/listingOpenRequirements.ts`

Still in UI:

- save/create branching
- listing draft lifecycle
- product removal side effects
- `statusMessage` decisions

Proposed application file:

- `src/application/listingEditor.ts`

Proposed use cases:

- `saveListingDraft(input)`
- `prepareListingEditState(input)`
- `removeListingProduct(input)`

Why:

- the UI still orchestrates listing lifecycle, not just rendering

### 5. Pricing editor rules

Current UI owner:

- `components/PricingEditor.tsx`

Current UI logic:

- pricing tier validation
- tier add/remove mutation rules
- min/max/supply consistency
- save/delete success state

Proposed application file:

- `src/application/pricingEditor.ts`

Proposed use cases:

- `validatePricingState(input)`
- `addPricingTier(input)`
- `removePricingTier(input)`
- `savePricingEditorState(input)`

Why:

- pricing logic is domain/application logic, not form logic

### 6. Asset detail editor flow

Current UI owner:

- `app/asset-provider/assets/[assetId]/page.tsx`

Current UI logic:

- append uploaded photos to asset images
- basic asset update normalization
- delete confirmation flow preparation

Proposed application file:

- `src/application/assetEditor.ts`

Proposed use cases:

- `appendAssetPhotos(input)`
- `updateAssetBasics(input)`
- `canDeleteAsset(input)`

Why:

- asset mutation policies should not sit in page code

## P3

### 7. Blog admin validation

Current UI owners:

- `app/platform-admin/blog-posts/page.tsx`
- `components/platform-admin/BlogPostForm.tsx`

Current UI logic:

- required field checks
- cover image requirement
- publish date checks

Proposed application file:

- `src/application/blogPostValidation.ts`

Proposed use cases:

- `validateBlogPostDraft(input)`

Why:

- lower-risk than checkout or asset submission, but still application logic

### 8. Account deletion flow

Current UI owners:

- `app/asset-provider/settings/page.tsx`
- `app/investor/settings/page.tsx`

Current UI logic:

- token presence checks
- delete request flow
- response error mapping

Proposed application file:

- `src/application/accountDeletion.ts`

Proposed use cases:

- `prepareAccountDeletion(input)`
- `deleteAccount(input)`

Why:

- useful cleanup, but lower product impact than investment and asset workflows

## Recommended implementation order

1. `checkoutFlow.ts`
2. `contractDeployment.ts`
3. `ownershipMinting.ts`
4. `listingEditor.ts`
5. `pricingEditor.ts`
6. `assetEditor.ts`

## Rule of thumb

If the UI is deciding:

- whether an action is allowed
- which business path to take
- what the next workflow step is
- how to derive a domain-oriented payload

then that logic is a candidate for `src/application`.
