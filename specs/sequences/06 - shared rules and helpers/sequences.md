# Shared Rules And Helpers Sequences

## 1. Listing Open Check

```mermaid
sequenceDiagram
  participant UI
  participant listingOpenPolicy as "domain/policies/listingOpenPolicy"

  UI->>listingOpenPolicy: getListingOpenRequirementError(listing, asset, products)
  listingOpenPolicy-->>UI: string | undefined
```

## 2. Checkout Rules

```mermaid
sequenceDiagram
  participant UI
  participant checkoutRules

  UI->>checkoutRules: getSelectedCheckoutProduct(products, requestedProductId)
  checkoutRules-->>UI: Product | null
  UI->>checkoutRules: getDefaultCheckoutQuantity(product, requestedQuantity)
  checkoutRules-->>UI: string
  UI->>checkoutRules: getCheckoutPaymentOptions(asset)
  checkoutRules-->>UI: CheckoutPaymentOption[]
  UI->>checkoutRules: getDefaultCheckoutPaymentType(asset, requestedPaymentType)
  checkoutRules-->>UI: CheckoutPaymentType
  UI->>checkoutRules: getCheckoutSubmissionError(input)
  checkoutRules-->>UI: error | undefined
```

## 3. Ownership Mint Rules

```mermaid
sequenceDiagram
  participant OwnershipMintingService
  participant ownershipMinting

  OwnershipMintingService->>ownershipMinting: getMintOwnershipError(input)
  OwnershipMintingService->>ownershipMinting: buildMintOwnershipRequest(input)
  OwnershipMintingService->>ownershipMinting: getMintOwnershipSuccessMessage(result)
  ownershipMinting-->>OwnershipMintingService: validation / request body / toast
```

## 4. Pricing Rules

```mermaid
sequenceDiagram
  participant UI
  participant pricingRules

  UI->>pricingRules: getPricingStateError(state)
  pricingRules-->>UI: string | undefined
  UI->>pricingRules: getPricingTierInputError(input)
  pricingRules-->>UI: string | undefined
  UI->>pricingRules: buildPricingTier(input)
  pricingRules-->>UI: PricingTier
```

## 5. Product Coupon Policy

```mermaid
sequenceDiagram
  participant UI
  participant InvestmentPlatformService
  participant CouponPreviewService
  participant productCouponPolicy as "domain/policies/productCouponPolicy"

  UI->>productCouponPolicy: normalizeCouponCode(code)
  productCouponPolicy-->>UI: normalized code
  InvestmentPlatformService->>productCouponPolicy: getCouponPricing(product, coupon)
  productCouponPolicy-->>InvestmentPlatformService: pricing result
  CouponPreviewService->>productCouponPolicy: getCouponPricing(product, coupon)
  productCouponPolicy-->>CouponPreviewService: pricing result
```

## 6. Asset Update Assembly

```mermaid
sequenceDiagram
  participant UI
  participant assetUpdateAssembler

  UI->>assetUpdateAssembler: buildUpdatedAssetBasics(asset, input)
  assetUpdateAssembler-->>UI: Asset
```

## 7. Asset Image Merge

```mermaid
sequenceDiagram
  participant AssetUploadFacade as "uploadAssetPhotos()"
  participant mergeAssetImagePaths as "infrastructure/storage/mergeAssetImagePaths"

  AssetUploadFacade->>mergeAssetImagePaths: mergeAssetImagePaths(asset, uploadedPaths)
  mergeAssetImagePaths-->>AssetUploadFacade: { storedPaths, publicUrls }
```
