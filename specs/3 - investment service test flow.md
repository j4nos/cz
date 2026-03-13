```mermaid
sequenceDiagram
  actor AssetProvider
  actor Investor
  participant InvestmentPlatformService
  participant InMemoryInvestmentRepository

  AssetProvider->>InvestmentPlatformService: registerUserProfile(input)
  InvestmentPlatformService->>InMemoryInvestmentRepository: createUserProfile(UserProfile)

  AssetProvider->>InvestmentPlatformService: createAsset(input)
  InvestmentPlatformService->>InMemoryInvestmentRepository: getUserProfileById(providerId)
  InvestmentPlatformService->>InMemoryInvestmentRepository: createAsset(Asset)

  AssetProvider->>InvestmentPlatformService: createListing(input)
  InvestmentPlatformService->>InMemoryInvestmentRepository: getAssetById(assetId)
  InvestmentPlatformService->>InMemoryInvestmentRepository: getUserProfileById(providerId)
  InvestmentPlatformService->>InMemoryInvestmentRepository: createListing(Listing)

  AssetProvider->>InvestmentPlatformService: createProduct(input)
  InvestmentPlatformService->>InMemoryInvestmentRepository: getListingById(listingId)
  InvestmentPlatformService->>InMemoryInvestmentRepository: createProduct(Product)

  Investor->>InvestmentPlatformService: registerUserProfile(input)
  InvestmentPlatformService->>InMemoryInvestmentRepository: createUserProfile(UserProfile)

  Investor->>InvestmentPlatformService: startOrder(input)
  InvestmentPlatformService->>InMemoryInvestmentRepository: getUserProfileById(investorId)
  InvestmentPlatformService->>InMemoryInvestmentRepository: getListingById(listingId)
  InvestmentPlatformService->>InMemoryInvestmentRepository: getProductById(productId)
  InvestmentPlatformService->>InMemoryInvestmentRepository: getAssetById(assetId)
  InvestmentPlatformService->>InMemoryInvestmentRepository: createOrder(Order)
  InvestmentPlatformService-->>Investor: Order status PENDING_PAYMENT

  Investor->>InvestmentPlatformService: completeOrderPayment(orderId)
  InvestmentPlatformService->>InMemoryInvestmentRepository: getOrderById(orderId)
  InvestmentPlatformService->>InMemoryInvestmentRepository: getProductById(productId)
  InvestmentPlatformService->>InMemoryInvestmentRepository: updateProduct(Product)
  InvestmentPlatformService->>InMemoryInvestmentRepository: updateOrder(Order)
  InvestmentPlatformService-->>Investor: Order status COMPLETED
```
