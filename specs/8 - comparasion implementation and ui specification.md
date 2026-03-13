# Comparison Implementation And UI Specification

## Scope

This document compares the current `cityzeen-tdd` implementation against the UI specifications stored under [specs/ui](/Users/kukodajanos/Workspace/cityzeen-tdd/specs/ui).

The focus here is on significant deviations only.

## Significant route-level deviations

- `app/register/page.tsx` and `app/settings/page.tsx`
  - The updated spec says every user is both asset provider and investor.
  - Current register flow still asks the user to choose a role.
  - Current `/settings` page still presents role-specific wording instead of a shared entry point to both settings areas.

- `app/platform-admin/homepage-cta/page.tsx` and `app/page.tsx`
  - The spec requires homepage CTA management to drive the two landing CTAs.
  - Current homepage CTA settings page is only a local form with toast feedback.
  - Current landing page still uses the first two open listings from `listFeaturedPublicListings`, not persisted first/second assetId-listingId pairs.

- `app/menu/page.tsx`, `app/forgot-password/page.tsx`, `app/gdpr/page.tsx`, `app/privacy/page.tsx`, `app/ui-catalog/page.tsx`, `app/global-error.tsx`
  - These are still missing versus the visitor/support route specs.

## Significant asset-wizard deviations

- `app/asset-provider/assets/new/step-2/page.tsx`
  - The spec requires actual image upload, Firebase storage by asset ID + index, and asset image count tracking.
  - Current implementation only stores selected file names in local wizard state.

- `app/asset-provider/assets/new/step-3/page.tsx`
  - The spec requires real document upload and `Document` metadata record creation.
  - Current implementation only stores local `type:name` strings in wizard state.

- `app/asset-provider/assets/new/step-4/page.tsx`
  - The spec says the asset should only be created on step 4. That part is aligned.
  - However, step 2/3 are still placeholders, so the submit flow does not yet satisfy the storage/document metadata requirements from the spec.

## Significant component deviations

- `components/listings.tsx`
  - The spec requires a card with a `100px x 100px` asset photo and a `400px x 150px` overall card size.
  - Current card media uses `185px x 185px`.
  - The spec also requires showing asset name and listing minimum price; current card title/body composition is different.
  - The spec requires only listings that are `Open` and inside the valid date window.
  - Current public listing reader filters by `saleStatus === "OPEN"` only; it does not enforce the date window.

- `components/listing.tsx`
  - The spec requires recalculating price with quantity discounts.
  - Current implementation recalculates total from base unit price only; discount tier pricing is not applied here.

- `components/sections/SectionContainer.tsx`
  - The spec requires a centered container with max width `400px`.
  - Current CSS uses `max-width: 720px`.

- `components/chat/ChatPanel.tsx`
  - Several required behaviors are only partially implemented or missing:
  - no Font Awesome icons
  - no attach button
  - no dictation button
  - no explicit spinner in the compose area
  - thread list is not constrained to 3 plus `more`
  - sticky/full-height/layout constraints from the spec are not fully guaranteed by the component itself

- `components/platform-admin/BlogPostForm.tsx`
  - The spec requires validation with visible errors before save.
  - Current form may not yet fully enforce all required-field validation expectations from the spec.

## Areas that are broadly aligned

- navbar auth/menu behavior is broadly aligned with the spec
- removing the explicit `/checkout` route is aligned with the updated visitor-route spec
- the asset-provider dashboard route is aligned with the updated route spec
- wizard step highlighting exists in `app/asset-provider/assets/new/layout.tsx`
- `app/investor/kyc/page.tsx` now matches the requested high-level shape: PlainCta + placeholder + status badge
- blog details sanitization exists in `components/blog/BlogDetails.tsx`
