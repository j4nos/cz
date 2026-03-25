# Asset And Listing Authoring Sequences

## 1. Asset Creation

```mermaid
sequenceDiagram
  participant UI
  participant InvestmentPlatformService
  participant AmplifyInvestmentRepository

  UI->>InvestmentPlatformService: createAsset(input)
  InvestmentPlatformService->>AmplifyInvestmentRepository: createAsset(draft asset)
  AmplifyInvestmentRepository-->>InvestmentPlatformService: Asset
  InvestmentPlatformService-->>UI: Asset
```

## 2. Asset Draft Save

```mermaid
sequenceDiagram
  participant UI
  participant SaveAssetDraftService
  participant AmplifyInvestmentRepository

  UI->>SaveAssetDraftService: save({ assetId?, userId, name, country, assetClass, tokenStandard })
  SaveAssetDraftService->>AmplifyInvestmentRepository: getAssetById(assetId or generated id)
  AmplifyInvestmentRepository-->>SaveAssetDraftService: Asset | null
  alt validation error or wrong ownership
    SaveAssetDraftService-->>UI: { kind: error, message }
    UI-->>UI: show error toast
  else existing draft
    SaveAssetDraftService->>AmplifyInvestmentRepository: updateAsset(draft asset)
    AmplifyInvestmentRepository-->>SaveAssetDraftService: Asset
    SaveAssetDraftService-->>UI: { kind: success, asset }
    UI->>UI: store assetId in wizard state
    UI->>UI: navigate to step-2
  else new draft
    SaveAssetDraftService->>AmplifyInvestmentRepository: createAsset(draft asset)
    AmplifyInvestmentRepository-->>SaveAssetDraftService: Asset
    SaveAssetDraftService-->>UI: { kind: success, asset }
    UI->>UI: store assetId in wizard state
    UI->>UI: navigate to step-2
  end
```

## 3. Asset Submission

```mermaid
sequenceDiagram
  participant UI
  participant ReadPort
  participant SubmitAssetAPI as "POST /api/assets/submit"
  participant VerifyToken as "verifyAccessToken"
  participant SubmitAssetService
  participant AmplifyInvestmentRepository
  participant TokenizationService
  participant RequestClaimGateway as "DynamoDbRequestClaimGateway"
  participant TokenizationGateway as "EthersTokenizationGateway"

  Note over UI,ReadPort: Trigger: page load
  UI->>ReadPort: getAssetById(assetId)
  ReadPort-->>UI: Asset
  UI->>UI: update wizard state from loaded asset

  Note over UI,SubmitAssetAPI: Trigger: user clicks "Submit asset"
  UI->>UI: validate review fields
  alt validation error
    UI-->>UI: show warning toast
  else ready to submit
    UI->>SubmitAssetAPI: POST with bearer token + asset payload
    SubmitAssetAPI->>VerifyToken: verifyAccessToken(token)
    VerifyToken-->>SubmitAssetAPI: user payload
    SubmitAssetAPI->>SubmitAssetService: submit({ assetId, userId, name, country, assetClass, tokenStandard })
    SubmitAssetService->>AmplifyInvestmentRepository: getAssetById(assetId)
    AmplifyInvestmentRepository-->>SubmitAssetService: Asset | null
    alt asset missing or wrong owner
      SubmitAssetService-->>SubmitAssetAPI: DomainError
      SubmitAssetAPI-->>UI: 4xx error
      UI-->>UI: show error toast
    else asset already tokenized
      SubmitAssetService->>AmplifyInvestmentRepository: updateAsset(submitted asset)
      AmplifyInvestmentRepository-->>SubmitAssetService: Asset
      SubmitAssetService-->>SubmitAssetAPI: Asset
      SubmitAssetAPI-->>UI: { asset }
      UI->>UI: reset wizard state
      UI-->>UI: show success toast
      UI->>UI: navigate to /asset-provider/assets/[assetId]
    else deploy required
      SubmitAssetService->>TokenizationService: tokenizeAsset({ assetId, userId, name, tokenStandard })
      TokenizationService->>AmplifyInvestmentRepository: getAssetById(assetId)
      AmplifyInvestmentRepository-->>TokenizationService: Asset
      TokenizationService->>AmplifyInvestmentRepository: createContractDeploymentRequestIfMissing(...)
      AmplifyInvestmentRepository-->>TokenizationService: ContractDeploymentRequest
      TokenizationService->>RequestClaimGateway: claimContractDeploymentRequest(requestId)
      RequestClaimGateway-->>TokenizationService: claimed
      TokenizationService->>TokenizationGateway: tokenize({ assetId, name, symbol, owner, tokenStandard })
      TokenizationGateway-->>TokenizationService: { address, standard, supportsErc721 }
      TokenizationService->>AmplifyInvestmentRepository: updateAssetTokenization({ assetId, tokenAddress, latestRunId })
      TokenizationService->>AmplifyInvestmentRepository: updateContractDeploymentRequest(...)
      TokenizationService-->>SubmitAssetService: { address, standard, supportsErc721, runId }
      SubmitAssetService->>AmplifyInvestmentRepository: updateAsset(tokenAddress, status=submitted)
      AmplifyInvestmentRepository-->>SubmitAssetService: Asset
      SubmitAssetService-->>SubmitAssetAPI: Asset
      SubmitAssetAPI-->>UI: { asset }
      UI->>UI: reset wizard state
      UI-->>UI: show success toast
      UI->>UI: navigate to /asset-provider/assets/[assetId]
    end
  end
```

## 4. Listing Draft Creation

```mermaid
sequenceDiagram
  participant UI
  participant ListingEditorFacade as "createListingEditorFacade()"
  participant ListingDraftService
  participant InvestmentPlatformService
  participant AmplifyInvestmentRepository
  participant RevalidateClient as "revalidateListings()"

  UI->>ListingEditorFacade: createListingDraft(input, accessToken)
  ListingEditorFacade->>ListingDraftService: createListingDraft(input)
  ListingDraftService->>InvestmentPlatformService: createListing(input)
  InvestmentPlatformService->>AmplifyInvestmentRepository: getAssetById(assetId)
  InvestmentPlatformService->>AmplifyInvestmentRepository: createListing(listing)
  AmplifyInvestmentRepository-->>InvestmentPlatformService: Asset, Listing
  InvestmentPlatformService-->>ListingDraftService: Listing
  ListingDraftService->>AmplifyInvestmentRepository: updateListing(draft listing)
  AmplifyInvestmentRepository-->>ListingDraftService: Listing
  ListingEditorFacade->>RevalidateClient: revalidateListings({ listingId })
  ListingEditorFacade-->>UI: Listing
```

## 5. Listing Draft Save

```mermaid
sequenceDiagram
  participant UI
  participant ListingEditorFacade as "createListingEditorFacade()"
  participant ListingDraftService
  participant AmplifyInvestmentRepository
  participant RevalidateClient as "revalidateListings()"

  UI->>ListingEditorFacade: saveListingDraft(listing, accessToken)
  ListingEditorFacade->>ListingDraftService: saveListingDraft(listing)
  ListingDraftService->>AmplifyInvestmentRepository: getListingById(listing.id)
  alt listing exists
    ListingDraftService->>AmplifyInvestmentRepository: updateListing(listing)
  else listing missing
    ListingDraftService->>AmplifyInvestmentRepository: createListing(listing)
  end
  AmplifyInvestmentRepository-->>ListingDraftService: Listing
  ListingEditorFacade->>RevalidateClient: revalidateListings({ listingId })
  ListingEditorFacade-->>UI: Listing
```

## 6. Product Creation

```mermaid
sequenceDiagram
  participant UI
  participant ProductPricingFacade as "createProductPricingFacade()"
  participant ProductPricingService
  participant AmplifyInvestmentRepository
  participant RevalidateClient as "revalidateListings()"

  UI->>ProductPricingFacade: savePricingState(new state, listingId, accessToken)
  ProductPricingFacade->>ProductPricingService: savePricingState(new state)
  ProductPricingService->>AmplifyInvestmentRepository: createProduct(product)
  AmplifyInvestmentRepository-->>ProductPricingService: Product
  ProductPricingFacade->>RevalidateClient: revalidateListings({ listingId })
  ProductPricingFacade-->>UI: ProductPricingState
```

## 7. Product Save

```mermaid
sequenceDiagram
  participant UI
  participant ProductPricingFacade as "createProductPricingFacade()"
  participant ProductPricingService
  participant AmplifyInvestmentRepository
  participant RevalidateClient as "revalidateListings()"

  UI->>ProductPricingFacade: savePricingState(existing state, listingId, accessToken)
  ProductPricingFacade->>ProductPricingService: savePricingState(existing state)
  ProductPricingService->>AmplifyInvestmentRepository: getProductById(productId)
  ProductPricingService->>AmplifyInvestmentRepository: updateProduct(product)
  AmplifyInvestmentRepository-->>ProductPricingService: Product
  ProductPricingFacade->>RevalidateClient: revalidateListings({ listingId })
  ProductPricingFacade-->>UI: ProductPricingState
```
