# Use cases sequence

## InvestmentPlatformService.createAsset

```mermaid
sequenceDiagram
  participant UI
  participant InvestmentPlatformService
  participant InvestmentRepository

  UI->>InvestmentPlatformService: createAsset(input)
  InvestmentPlatformService->>InvestmentRepository: createAsset(asset)
  InvestmentRepository-->>InvestmentPlatformService: Asset
  InvestmentPlatformService-->>UI: Asset
```

## InvestmentPlatformService.createListing

```mermaid
sequenceDiagram
  participant UI
  participant InvestmentPlatformService
  participant InvestmentRepository

  UI->>InvestmentPlatformService: createListing(input)
  InvestmentPlatformService->>InvestmentRepository: getAssetById(assetId)
  InvestmentRepository-->>InvestmentPlatformService: Asset
  InvestmentPlatformService->>InvestmentRepository: createListing(listing)
  InvestmentRepository-->>InvestmentPlatformService: Listing
  InvestmentPlatformService-->>UI: Listing
```

## InvestmentPlatformService.saveListing

```mermaid
sequenceDiagram
  participant UI
  participant InvestmentPlatformService
  participant InvestmentRepository

  UI->>InvestmentPlatformService: saveListing(listing)
  InvestmentPlatformService->>InvestmentRepository: updateListing(listing)
  InvestmentRepository-->>InvestmentPlatformService: Listing
  InvestmentPlatformService-->>UI: Listing
```

## InvestmentPlatformService.createProduct

```mermaid
sequenceDiagram
  participant UI
  participant InvestmentPlatformService
  participant InvestmentRepository

  UI->>InvestmentPlatformService: createProduct(input)
  InvestmentPlatformService->>InvestmentRepository: getListingById(listingId)
  InvestmentRepository-->>InvestmentPlatformService: Listing
  InvestmentPlatformService->>InvestmentRepository: createProduct(product)
  InvestmentRepository-->>InvestmentPlatformService: Product
  InvestmentPlatformService-->>UI: Product
```

## InvestmentPlatformService.saveProduct

```mermaid
sequenceDiagram
  participant UI
  participant InvestmentPlatformService
  participant InvestmentRepository

  UI->>InvestmentPlatformService: saveProduct(product)
  InvestmentPlatformService->>InvestmentRepository: getProductById(product.id)
  InvestmentRepository-->>InvestmentPlatformService: Product
  InvestmentPlatformService->>InvestmentRepository: updateProduct(product)
  InvestmentRepository-->>InvestmentPlatformService: Product
  InvestmentPlatformService-->>UI: Product
```

## InvestmentPlatformService.startOrder

```mermaid
sequenceDiagram
  participant UI
  participant InvestmentPlatformService
  participant InvestmentRepository

  UI->>InvestmentPlatformService: startOrder(input)
  InvestmentPlatformService->>InvestmentRepository: getListingById(listingId)
  InvestmentPlatformService->>InvestmentRepository: getProductById(productId)
  InvestmentRepository-->>InvestmentPlatformService: Listing, Product
  InvestmentPlatformService->>InvestmentRepository: createOrder(order)
  InvestmentRepository-->>InvestmentPlatformService: Order
  InvestmentPlatformService-->>UI: Order
```

## InvestmentPlatformService.completeOrderPayment

```mermaid
sequenceDiagram
  participant UI
  participant InvestmentPlatformService
  participant InvestmentRepository

  UI->>InvestmentPlatformService: completeOrderPayment({ orderId })
  InvestmentPlatformService->>InvestmentRepository: getOrderById(orderId)
  InvestmentRepository-->>InvestmentPlatformService: Order
  InvestmentPlatformService->>InvestmentRepository: updateOrder(paidOrder)
  InvestmentRepository-->>InvestmentPlatformService: Order
  InvestmentPlatformService-->>UI: Order
```

## CheckoutService.loadCheckout

```mermaid
sequenceDiagram
  participant InvestPage as "Invest.tsx"
  participant CheckoutService
  participant ReadPort
  participant AuthClient
  participant checkoutRules

  Note over InvestPage,CheckoutService: Trigger: page load / route change
  InvestPage->>CheckoutService: loadCheckout(input)
  CheckoutService->>ReadPort: getListingById(listingId)
  CheckoutService->>ReadPort: getAssetById(assetId)
  CheckoutService->>ReadPort: listProductsByListingId(listingId)
  CheckoutService->>checkoutRules: getSelectedCheckoutProduct(products, requestedProductId)
  checkoutRules-->>CheckoutService: Product | null
  CheckoutService->>checkoutRules: getDefaultCheckoutQuantity(product, initialQuantity)
  checkoutRules-->>CheckoutService: quantity
  CheckoutService->>checkoutRules: getDefaultCheckoutPaymentType(asset, requestedPaymentType)
  checkoutRules-->>CheckoutService: paymentType
  CheckoutService->>checkoutRules: getCheckoutPaymentOptions(asset)
  checkoutRules-->>CheckoutService: CheckoutPaymentOption[]
  CheckoutService->>AuthClient: getUserProfile(asset.tenantUserId)
  CheckoutService-->>InvestPage: listing, asset, products, providerName, selectedProductId, quantity, paymentType, paymentOptions
```

## CheckoutService.submitCheckout

```mermaid
sequenceDiagram
  participant InvestPage as "Invest.tsx"
  participant CheckoutService
  participant checkoutRules
  participant OrderPort
  participant PowensAPI

  Note over InvestPage,CheckoutService: Trigger: user clicks "Place Order"
  InvestPage->>CheckoutService: submitCheckout(input)
  CheckoutService->>checkoutRules: getCheckoutSubmissionError(input)
  alt validation error
    CheckoutService-->>InvestPage: { kind: error }
  else card
    CheckoutService->>OrderPort: placeOrder(input)
    OrderPort-->>CheckoutService: Order
    CheckoutService-->>InvestPage: { kind: success, orderId }
  else bank-transfer
    CheckoutService->>OrderPort: placeOrder(input)
    OrderPort-->>CheckoutService: Order
    CheckoutService->>PowensAPI: createBankTransferPayment(orderId, accessToken)
    PowensAPI-->>CheckoutService: redirectUrl
    CheckoutService-->>InvestPage: { kind: redirect, url }
  end
```

## ContractDeploymentService.loadAssetReview

```mermaid
sequenceDiagram
  participant UI
  participant ContractDeploymentService
  participant AssetRepository

  UI->>ContractDeploymentService: loadAssetReview(assetId, wizardTokenStandard)
  ContractDeploymentService->>AssetRepository: getAssetById(assetId)
  AssetRepository-->>ContractDeploymentService: Asset
  ContractDeploymentService-->>UI: asset, wizardPatch
```

## ContractDeploymentService.submit

```mermaid
sequenceDiagram
  participant UI
  participant ContractDeploymentService
  participant contractDeploymentRules
  participant TokenizeAssetAPI
  participant TokenizationService
  participant AssetTokenizationRepository
  participant TokenizationGateway

  UI->>ContractDeploymentService: submit(input)
  ContractDeploymentService->>contractDeploymentRules: getContractDeploymentError(input)
  alt validation error
    ContractDeploymentService-->>UI: { kind: error }
  else deploy needed
    ContractDeploymentService->>TokenizeAssetAPI: deployContract(payload)
    TokenizeAssetAPI->>TokenizationService: tokenizeAsset(input)
    TokenizationService->>AssetTokenizationRepository: getAssetById(assetId)
    TokenizationService->>AssetTokenizationRepository: createContractDeploymentRequestIfMissing({ requestId: "contract-deployment:{assetId}", idempotencyKey, latestRunId })
    alt existing ContractDeploymentRequest
      AssetTokenizationRepository-->>TokenizationService: { request, created: false }
      alt request.tokenAddress exists
        TokenizationService-->>TokenizeAssetAPI: existing TokenizationResult
      else request in progress
        TokenizationService-->>TokenizeAssetAPI: DomainError("Contract deployment already in progress.")
      end
    else new ContractDeploymentRequest created
      AssetTokenizationRepository-->>TokenizationService: { request, created: true }
      TokenizationService->>AssetTokenizationRepository: updateContractDeploymentRequest(submitting)
      TokenizationService->>TokenizationGateway: tokenize(payload)
      TokenizationGateway-->>TokenizationService: deployed contract
      TokenizationService->>AssetTokenizationRepository: updateAssetTokenization({ assetId, tokenAddress, latestRunId })
      TokenizationService->>AssetTokenizationRepository: updateContractDeploymentRequest(submitted)
      TokenizationService-->>TokenizeAssetAPI: TokenizationResult
    end
    TokenizeAssetAPI-->>ContractDeploymentService: address
    ContractDeploymentService-->>UI: { kind: success, asset }
  else deploy not needed
    ContractDeploymentService-->>UI: { kind: success, asset }
  end
```

## TokenizationService.tokenizeAsset

```mermaid
sequenceDiagram
  participant TokenizeAssetAPI as "POST /api/tokenize-asset"
  participant TokenizationService
  participant AssetTokenizationRepository
  participant TokenizationGateway

  TokenizeAssetAPI->>TokenizationService: tokenizeAsset(input)
  TokenizationService->>AssetTokenizationRepository: getAssetById(assetId)
  AssetTokenizationRepository-->>TokenizationService: Asset
  alt asset.tokenAddress already exists
    TokenizationService-->>TokenizeAssetAPI: existing TokenizationResult
  else no tokenAddress
    TokenizationService->>AssetTokenizationRepository: createContractDeploymentRequestIfMissing({ requestId: "contract-deployment:{assetId}", idempotencyKey, latestRunId })
    alt existing request
      AssetTokenizationRepository-->>TokenizationService: { request, created: false }
      alt request.tokenAddress exists
        TokenizationService-->>TokenizeAssetAPI: existing TokenizationResult
      else request in progress
        TokenizationService-->>TokenizeAssetAPI: DomainError("Contract deployment already in progress.")
      end
    else request created
      AssetTokenizationRepository-->>TokenizationService: { request, created: true }
      TokenizationService->>AssetTokenizationRepository: updateContractDeploymentRequest(submitting)
      TokenizationService->>TokenizationGateway: tokenize(payload)
      TokenizationGateway-->>TokenizationService: deployed contract
      TokenizationService->>AssetTokenizationRepository: updateAssetTokenization({ assetId, tokenAddress, latestRunId })
      TokenizationService->>AssetTokenizationRepository: updateContractDeploymentRequest(submitted)
      TokenizationService-->>TokenizeAssetAPI: TokenizationResult
    end
  end
```

## OwnershipMintingService.resolveContext

```mermaid
sequenceDiagram
  participant UI
  participant OwnershipMintingService
  participant ReadPort

  UI->>OwnershipMintingService: resolveContext(order, knownTokenAddress)
  OwnershipMintingService->>ReadPort: getListingById(order.listingId)
  OwnershipMintingService->>ReadPort: getAssetById(listing.assetId)
  ReadPort-->>OwnershipMintingService: Listing, Asset
  OwnershipMintingService-->>UI: listing, asset, tokenAddress
```

## OwnershipMintingService.mint

```mermaid
sequenceDiagram
  participant UI
  participant OwnershipMintingService
  participant ownershipMinting
  participant ReadPort
  participant MintOwnershipAPI

  UI->>OwnershipMintingService: mint(input)
  OwnershipMintingService->>ReadPort: getListingById(order.listingId)
  OwnershipMintingService->>ReadPort: getAssetById(listing.assetId)
  OwnershipMintingService->>ownershipMinting: getMintOwnershipError(input)
  alt validation error
    OwnershipMintingService-->>UI: { kind: error }
  else valid
    OwnershipMintingService->>ownershipMinting: buildMintOwnershipRequest(input)
    OwnershipMintingService->>MintOwnershipAPI: requestMint(accessToken, body)
    MintOwnershipAPI-->>OwnershipMintingService: MintResult
    OwnershipMintingService->>ownershipMinting: getMintOwnershipSuccessMessage(result)
    OwnershipMintingService-->>UI: { kind: success, result, toast }
  end
```

## POST /api/mint-ownership

```mermaid
sequenceDiagram
  participant UI
  participant MintOwnershipAPI as "POST /api/mint-ownership"
  participant InvestmentRepository

  UI->>MintOwnershipAPI: { orderId, walletAddress }
  MintOwnershipAPI->>InvestmentRepository: getOrderById(orderId)
  InvestmentRepository-->>MintOwnershipAPI: Order
  MintOwnershipAPI->>InvestmentRepository: getListingById(order.listingId)
  InvestmentRepository-->>MintOwnershipAPI: Listing
  alt order.mintedAt exists
    MintOwnershipAPI-->>UI: { status: "minted" }
  else order.mintRequestedAt exists
    MintOwnershipAPI-->>UI: { status: "pending" }
  else no mint started
    MintOwnershipAPI->>InvestmentRepository: createMintRequestIfMissing({ requestId: "mint:{orderId}", orderId, assetId, idempotencyKey, walletAddress, createdAt })
    alt existing MintRequest
      InvestmentRepository-->>MintOwnershipAPI: { request, created: false }
      alt request.mintStatus == minted
        MintOwnershipAPI-->>UI: { status: "minted" }
      else
        MintOwnershipAPI-->>UI: { status: "pending" }
      end
    else new MintRequest created
      InvestmentRepository-->>MintOwnershipAPI: { request, created: true }
      MintOwnershipAPI->>InvestmentRepository: updateOrder({ mintRequestedAt, investorWalletAddress })
      MintOwnershipAPI-->>UI: { status: "queued" }
    end
  end
```

## AccountSettingsService.saveProviderSettings

```mermaid
sequenceDiagram
  participant UI
  participant AccountSettingsService
  participant AuthClient

  UI->>AccountSettingsService: saveProviderSettings(input)
  AccountSettingsService->>AuthClient: upsertUserProfile(input)
  AuthClient-->>AccountSettingsService: void
  AccountSettingsService-->>UI: { kind: success }
```

## AccountSettingsService.saveInvestorSettings

```mermaid
sequenceDiagram
  participant UI
  participant AccountSettingsService
  participant AuthClient

  UI->>AccountSettingsService: saveInvestorSettings(input)
  AccountSettingsService->>AuthClient: upsertUserProfile(input)
  AuthClient-->>AccountSettingsService: void
  AccountSettingsService-->>UI: { kind: success }
```

## AccountSettingsService.deleteAccount

```mermaid
sequenceDiagram
  participant UI
  participant AccountSettingsService
  participant DeleteAccountAPI

  UI->>AccountSettingsService: deleteAccount(accessToken)
  AccountSettingsService->>DeleteAccountAPI: deleteAccountRequest(accessToken)
  DeleteAccountAPI-->>AccountSettingsService: void
  AccountSettingsService-->>UI: { kind: success }
```

## BlogPostAdminService.loadPosts

```mermaid
sequenceDiagram
  participant UI
  participant BlogPostAdminService
  participant BlogAdminPort

  UI->>BlogPostAdminService: loadPosts()
  BlogPostAdminService->>BlogAdminPort: listBlogPosts()
  BlogAdminPort-->>BlogPostAdminService: BlogPost[]
  BlogPostAdminService-->>UI: BlogPost[]
```

## BlogPostAdminService.validate

```mermaid
sequenceDiagram
  participant UI
  participant BlogPostAdminService

  UI->>BlogPostAdminService: validate({ values, coverFile })
  BlogPostAdminService-->>UI: error | undefined
```

## BlogPostAdminService.save

```mermaid
sequenceDiagram
  participant UI
  participant BlogPostAdminService
  participant BlogAdminPort
  participant StorageUpload

  UI->>BlogPostAdminService: save({ values, coverFile })
  BlogPostAdminService->>BlogPostAdminService: validate(input)
  BlogPostAdminService->>BlogAdminPort: saveBlogPost(post)
  BlogAdminPort-->>BlogPostAdminService: BlogPost
  opt coverFile present
    BlogPostAdminService->>StorageUpload: uploadCoverImage(postId, file)
    StorageUpload-->>BlogPostAdminService: coverImagePath
    BlogPostAdminService->>BlogAdminPort: saveBlogPost(updatedPost)
    BlogAdminPort-->>BlogPostAdminService: BlogPost
  end
  BlogPostAdminService-->>UI: BlogPost
```

## BlogPostAdminService.delete

```mermaid
sequenceDiagram
  participant UI
  participant BlogPostAdminService
  participant BlogAdminPort

  UI->>BlogPostAdminService: delete(postId)
  BlogPostAdminService->>BlogAdminPort: deleteBlogPost(postId)
  BlogAdminPort-->>BlogPostAdminService: void
  BlogPostAdminService-->>UI: void
```

## PowensPaymentSyncService.syncByPaymentProviderId

```mermaid
sequenceDiagram
  participant PowensWebhookRoute
  participant PowensPaymentSyncService
  participant InvestmentRepository
  participant InvestmentPlatformService

  PowensWebhookRoute->>PowensPaymentSyncService: syncByPaymentProviderId(paymentProviderId, paymentState)
  PowensPaymentSyncService->>InvestmentRepository: findOrderByPaymentProviderId(paymentProviderId)
  InvestmentRepository-->>PowensPaymentSyncService: Order
  alt paymentState maps to paid and Order.status is pending
    PowensPaymentSyncService->>InvestmentPlatformService: completeOrderPayment({ orderId })
    InvestmentPlatformService-->>PowensPaymentSyncService: paid Order
    PowensPaymentSyncService->>InvestmentRepository: updateOrder(order with paymentProviderStatus)
  else other payment state
    PowensPaymentSyncService->>InvestmentRepository: updateOrder(order with status and paymentProviderStatus)
  end
  PowensPaymentSyncService-->>PowensWebhookRoute: Order | null
```

## PowensPaymentSyncService.syncByOrderId

```mermaid
sequenceDiagram
  participant PowensPaymentStatusRoute
  participant PowensPaymentSyncService
  participant InvestmentRepository
  participant InvestmentPlatformService

  PowensPaymentStatusRoute->>PowensPaymentSyncService: syncByOrderId(orderId, paymentState)
  PowensPaymentSyncService->>InvestmentRepository: getOrderById(orderId)
  InvestmentRepository-->>PowensPaymentSyncService: Order
  alt paymentState maps to paid and Order.status is pending
    PowensPaymentSyncService->>InvestmentPlatformService: completeOrderPayment({ orderId })
    InvestmentPlatformService-->>PowensPaymentSyncService: paid Order
    PowensPaymentSyncService->>InvestmentRepository: updateOrder(order with paymentProviderStatus)
  else other payment state
    PowensPaymentSyncService->>InvestmentRepository: updateOrder(order with status and paymentProviderStatus)
  end
  PowensPaymentSyncService-->>PowensPaymentStatusRoute: Order | null
```

## publicContent.listPublicListings

```mermaid
sequenceDiagram
  participant UI
  participant publicContent
  participant PublicContentReader

  UI->>publicContent: listPublicListings()
  publicContent->>PublicContentReader: listPublicListings()
  PublicContentReader-->>publicContent: PublicListingWithAsset[]
  publicContent-->>UI: PublicListingWithAsset[]
```

## publicContent.getPublicListingDetails

```mermaid
sequenceDiagram
  participant UI
  participant publicContent
  participant PublicContentReader

  UI->>publicContent: getPublicListingDetails(listingId)
  publicContent->>PublicContentReader: getPublicListingById(listingId)
  publicContent->>PublicContentReader: listProductsByListingId(listingId)
  PublicContentReader-->>publicContent: listingWithAsset, products
  publicContent-->>UI: listingWithAsset, products
```

## publicContent.listPublicBlogPosts

```mermaid
sequenceDiagram
  participant UI
  participant publicContent
  participant PublicContentReader

  UI->>publicContent: listPublicBlogPosts()
  publicContent->>PublicContentReader: listPublicBlogPosts()
  PublicContentReader-->>publicContent: BlogPost[]
  publicContent-->>UI: BlogPost[]
```

## publicContent.getPublicBlogPost

```mermaid
sequenceDiagram
  participant UI
  participant publicContent
  participant PublicContentReader

  UI->>publicContent: getPublicBlogPost(blogId)
  publicContent->>PublicContentReader: getPublicBlogPost(blogId)
  PublicContentReader-->>publicContent: BlogPost | null
  publicContent-->>UI: BlogPost | null
```

## publicContent.getInvestorOrderEntry

```mermaid
sequenceDiagram
  participant UI
  participant publicContent
  participant PublicContentReader

  UI->>publicContent: getInvestorOrderEntry(orderId)
  publicContent->>PublicContentReader: getOrderById(orderId)
  publicContent->>PublicContentReader: getPublicListingById(order.listingId)
  PublicContentReader-->>publicContent: Order, PublicListingWithAsset
  publicContent-->>UI: order, listingWithAsset
```

## listingOpenRequirements.getListingOpenRequirementError

```mermaid
sequenceDiagram
  participant UI
  participant listingOpenRequirements

  UI->>listingOpenRequirements: getListingOpenRequirementError(listing, asset, products)
  listingOpenRequirements-->>UI: string | undefined
```

## checkoutRules

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

## contractDeploymentRules

```mermaid
sequenceDiagram
  participant ContractDeploymentService
  participant contractDeploymentRules

  ContractDeploymentService->>contractDeploymentRules: getContractDeploymentError(input)
  ContractDeploymentService->>contractDeploymentRules: getDesiredContractStandard(input)
  ContractDeploymentService->>contractDeploymentRules: shouldDeployContract(asset)
  ContractDeploymentService->>contractDeploymentRules: buildAssetAfterContractDeployment(input)
  contractDeploymentRules-->>ContractDeploymentService: validation / payload / next Asset
```

## ownershipMinting

```mermaid
sequenceDiagram
  participant OwnershipMintingService
  participant ownershipMinting

  OwnershipMintingService->>ownershipMinting: getMintOwnershipError(input)
  OwnershipMintingService->>ownershipMinting: buildMintOwnershipRequest(input)
  OwnershipMintingService->>ownershipMinting: getMintOwnershipSuccessMessage(result)
  ownershipMinting-->>OwnershipMintingService: validation / request body / toast
```

## pricingRules

```mermaid
sequenceDiagram
  participant UI
  participant pricingRules

  UI->>pricingRules: validatePricingState(state)
  pricingRules-->>UI: string | undefined
  UI->>pricingRules: validatePricingTierInput(input)
  pricingRules-->>UI: string | undefined
  UI->>pricingRules: buildPricingTier(input)
  pricingRules-->>UI: PricingTier
```

## assetUpdateAssembler

```mermaid
sequenceDiagram
  participant UI
  participant assetUpdateAssembler

  UI->>assetUpdateAssembler: buildUpdatedAssetBasics(asset, input)
  assetUpdateAssembler-->>UI: Asset
  UI->>assetUpdateAssembler: mergeAssetImagePaths(currentPaths, uploadedPaths)
  assetUpdateAssembler-->>UI: string[]
```
