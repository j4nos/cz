# Asset And Listing Authoring Sequences

## InvestmentPlatformService.createAsset

```mermaid
sequenceDiagram
  participant UI
  participant InvestmentPlatformService
  participant AppSyncGraphQL as "Amplify Data GraphQL"

  UI->>InvestmentPlatformService: createAsset(input)
  InvestmentPlatformService->>AppSyncGraphQL: createAsset(asset)
  AppSyncGraphQL-->>InvestmentPlatformService: Asset
  InvestmentPlatformService-->>UI: Asset
```

## AssetSubmissionFlow.submitAsset

```mermaid
sequenceDiagram
  participant Step4Page as "Step4PageContent.tsx"
  participant AssetRepository
  participant SubmitAssetAPI as "POST /api/assets/submit"
  participant VerifyToken as "verifyAccessToken"
  participant AppSyncGraphQL as "Amplify Data GraphQL"
  participant TokenizationGateway

  Note over Step4Page,AssetRepository: Trigger: page load
  Step4Page->>AssetRepository: getAssetById(assetId)
  AssetRepository-->>Step4Page: Asset
  Step4Page->>Step4Page: update wizard state from loaded asset

  Note over Step4Page,SubmitAssetAPI: Trigger: user clicks "Submit asset"
  Step4Page->>Step4Page: validate review fields
  alt validation error
    Step4Page-->>Step4Page: show warning toast
  else ready to submit
    Step4Page->>SubmitAssetAPI: POST with bearer token + asset payload
    SubmitAssetAPI->>VerifyToken: verifyAccessToken(token)
    VerifyToken-->>SubmitAssetAPI: user payload
    SubmitAssetAPI->>AppSyncGraphQL: getAsset(id) with Authorization: bearer token
    AppSyncGraphQL-->>SubmitAssetAPI: Asset
    alt asset owned by another user
      SubmitAssetAPI-->>Step4Page: 403 Forbidden
      Step4Page-->>Step4Page: show error toast
    else asset already tokenized
      SubmitAssetAPI->>AppSyncGraphQL: updateAsset(status=submitted)
      AppSyncGraphQL-->>SubmitAssetAPI: Asset
      SubmitAssetAPI-->>Step4Page: { asset }
      Step4Page->>Step4Page: reset wizard state
      Step4Page-->>Step4Page: show success toast
      Step4Page->>Step4Page: navigate to /asset-provider/assets/[assetId]
    else deploy required
      SubmitAssetAPI->>TokenizationGateway: tokenize(payload)
      TokenizationGateway-->>SubmitAssetAPI: deployed contract
      SubmitAssetAPI->>AppSyncGraphQL: updateAsset(tokenAddress, status=submitted)
      AppSyncGraphQL-->>SubmitAssetAPI: Asset
      SubmitAssetAPI-->>Step4Page: { asset }
      Step4Page->>Step4Page: reset wizard state
      Step4Page-->>Step4Page: show success toast
      Step4Page->>Step4Page: navigate to /asset-provider/assets/[assetId]
    end
  end
```

## InvestmentPlatformService.createListing

```mermaid
sequenceDiagram
  participant UI
  participant InvestmentPlatformService
  participant AppSyncGraphQL as "Amplify Data GraphQL"

  UI->>InvestmentPlatformService: createListing(input)
  InvestmentPlatformService->>AppSyncGraphQL: getAsset(assetId)
  AppSyncGraphQL-->>InvestmentPlatformService: Asset
  InvestmentPlatformService->>AppSyncGraphQL: createListing(listing)
  AppSyncGraphQL-->>InvestmentPlatformService: Listing
  InvestmentPlatformService-->>UI: Listing
```

## InvestmentPlatformService.saveListing

```mermaid
sequenceDiagram
  participant UI
  participant InvestmentPlatformService
  participant AppSyncGraphQL as "Amplify Data GraphQL"

  UI->>InvestmentPlatformService: saveListing(listing)
  InvestmentPlatformService->>AppSyncGraphQL: updateListing(listing)
  AppSyncGraphQL-->>InvestmentPlatformService: Listing
  InvestmentPlatformService-->>UI: Listing
```

## InvestmentPlatformService.createProduct

```mermaid
sequenceDiagram
  participant UI
  participant InvestmentPlatformService
  participant AppSyncGraphQL as "Amplify Data GraphQL"

  UI->>InvestmentPlatformService: createProduct(input)
  InvestmentPlatformService->>AppSyncGraphQL: getListing(listingId)
  AppSyncGraphQL-->>InvestmentPlatformService: Listing
  InvestmentPlatformService->>AppSyncGraphQL: createProduct(product)
  AppSyncGraphQL-->>InvestmentPlatformService: Product
  InvestmentPlatformService-->>UI: Product
```

## InvestmentPlatformService.saveProduct

```mermaid
sequenceDiagram
  participant UI
  participant InvestmentPlatformService
  participant AppSyncGraphQL as "Amplify Data GraphQL"

  UI->>InvestmentPlatformService: saveProduct(product)
  InvestmentPlatformService->>AppSyncGraphQL: getProduct(product.id)
  AppSyncGraphQL-->>InvestmentPlatformService: Product
  InvestmentPlatformService->>AppSyncGraphQL: updateProduct(product)
  AppSyncGraphQL-->>InvestmentPlatformService: Product
  InvestmentPlatformService-->>UI: Product
```
