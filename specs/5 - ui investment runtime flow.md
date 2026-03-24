## Asset provider flow

```mermaid
sequenceDiagram
  actor AssetProvider as Asset Provider
  participant UI as UI
  participant AssetController as AssetController
  participant ListingController as ListingController
  participant PricingController as PricingController
  participant Service as InvestmentPlatformService
  participant Repo as AmplifyInvestmentRepository
  participant SubmitApi as /api/assets/submit

  AssetProvider->>UI: register / login
  AssetProvider->>UI: create asset draft
  UI->>AssetController: createAssetWithMedia(...)
  AssetController->>Service: createAsset(...)
  Service->>Repo: getUserProfileById(tenantUserId)
  Repo-->>Service: UserProfile
  Service->>Repo: createAsset(Asset status=draft)
  Repo-->>Service: Asset
  AssetController->>Repo: updateAsset(...)
  Repo-->>AssetController: Asset
  AssetController-->>UI: Asset

  AssetProvider->>UI: create / edit listing
  UI->>ListingController: createListingDraft(...) or saveListingDraft(...)
  ListingController->>Service: createListing(...)
  Service->>Repo: getAssetById(assetId)
  Repo-->>Service: Asset
  Service->>Repo: getUserProfileById(asset.tenantUserId)
  Repo-->>Service: UserProfile
  Service->>Repo: createListing(Listing saleStatus=open|closed)
  Repo-->>Service: Listing
  ListingController-->>UI: Listing

  AssetProvider->>UI: create / edit pricing product
  UI->>PricingController: savePricingState(ProductPricingState)
  PricingController->>Service: createProduct(...) or update existing product
  Service->>Repo: getListingById(listingId)
  Repo-->>Service: Listing
  Service->>Repo: createProduct(Product with tiers/coupons)
  Repo-->>Service: Product
  PricingController-->>UI: ProductPricingState

  AssetProvider->>UI: submit asset
  UI->>SubmitApi: POST assetId + tokenStandard + asset fields
  SubmitApi->>Repo: getAssetById(assetId)
  Repo-->>SubmitApi: Asset
  SubmitApi->>Repo: updateAsset(...)
  Repo-->>SubmitApi: Asset
  SubmitApi-->>UI: submitted asset
```

## Visitor and investor checkout flow

```mermaid
sequenceDiagram
  actor Visitor as Visitor / Investor
  participant ListingUI as Listing page
  participant CheckoutUI as Checkout page
  participant CheckoutService as CheckoutService
  participant OrderController as OrderController
  participant Service as InvestmentPlatformService
  participant Repo as AmplifyInvestmentRepository
  participant PowensApi as /api/powens/create-payment

  Visitor->>ListingUI: open listing
  Visitor->>ListingUI: select product / quantity / coupon
  ListingUI-->>Visitor: go to checkout route

  Visitor->>CheckoutUI: open checkout
  CheckoutUI->>CheckoutService: loadCheckout(listingId, productId, quantity)
  CheckoutService->>Repo: getListingById(listingId)
  Repo-->>CheckoutService: Listing
  CheckoutService->>Repo: getAssetById(listing.assetId)
  Repo-->>CheckoutService: Asset
  CheckoutService->>Repo: listProductsByListingId(listingId)
  Repo-->>CheckoutService: Product[]
  CheckoutService-->>CheckoutUI: listing + asset + products + payment options

  Visitor->>CheckoutUI: choose payment type / notes / coupon
  Visitor->>CheckoutUI: place order
  alt not logged in
    CheckoutService-->>CheckoutUI: error(Login required to place order)
  else logged in
    CheckoutUI->>OrderController: placeOrder(investorId, listingId, productId, quantity, coupon, notes, paymentProvider)
    OrderController->>Service: startOrder(...)
    Service->>Repo: getUserProfileById(investorId)
    Repo-->>Service: UserProfile
    Service->>Repo: getListingById(listingId)
    Repo-->>Service: Listing
    Service->>Repo: getProductById(productId)
    Repo-->>Service: Product
    Service->>Repo: getAssetById(listing.assetId)
    Repo-->>Service: Asset
    Service->>Repo: createOrder(Order status=pending)
    Repo-->>Service: Order
    OrderController-->>CheckoutUI: Order

    alt paymentProvider = card
      CheckoutUI-->>Visitor: redirect to /investor/orders/:orderId
    else paymentProvider = bank-transfer
      CheckoutUI->>PowensApi: POST orderId
      PowensApi->>Repo: updateOrder(paymentProviderId, paymentProviderStatus)
      Repo-->>PowensApi: Order payment metadata saved
      PowensApi-->>CheckoutUI: redirectUrl
      CheckoutUI-->>Visitor: redirect to Powens
    end
  end
```

## Bank transfer return and payment sync

```mermaid
sequenceDiagram
  actor Investor as Investor
  participant Powens as Powens
  participant CallbackUI as /powens/callback
  participant StatusApi as /api/powens/payment-status
  participant Repo as AmplifyInvestmentRepository

  Powens-->>CallbackUI: redirect back with state=orderId
  CallbackUI->>Repo: getOrderById(orderId)
  Repo-->>CallbackUI: Order
  CallbackUI->>StatusApi: POST orderId
  StatusApi->>Repo: getOrderById(orderId)
  Repo-->>StatusApi: Order
  StatusApi->>Repo: updateOrder(status=pending|paid|failed, paymentProviderStatus)
  Repo-->>StatusApi: Order
  StatusApi-->>CallbackUI: paymentState + orderStatus
  CallbackUI-->>Investor: link to /investor/orders/:orderId
```

## Order completion paths

```mermaid
sequenceDiagram
  actor AssetProvider as Asset Provider
  participant ProviderUI as /asset-provider/orders
  participant OrderController as OrderController
  participant Service as InvestmentPlatformService
  participant Repo as AmplifyInvestmentRepository

  AssetProvider->>ProviderUI: open provider orders
  ProviderUI->>Repo: listOrdersByProvider(userId)
  Repo-->>ProviderUI: Order[]

  alt provider marks order paid manually
    AssetProvider->>ProviderUI: click Mark paid
    ProviderUI->>OrderController: completeOrder(orderId)
    OrderController->>Service: completeOrderPayment(orderId)
    Service->>Repo: getOrderById(orderId)
    Repo-->>Service: Order
    Service->>Repo: getProductById(order.productId)
    Repo-->>Service: Product
    Service->>Repo: updateProduct(remainingSupply -= quantity)
    Repo-->>Service: Product
    Service->>Repo: updateOrder(status=paid)
    Repo-->>Service: Order
    OrderController-->>ProviderUI: Order
  end
```

## Notes

- A publikus checkout route és az investor checkout route ugyanazt a `Invest` komponenst használja, csak más `mode`-dal.
- A rendelés létrehozása mindig `pending` státusszal indul.
- A sikeres fizetés utáni rendelés státusza jelenleg `paid`, nem `completed`.
- Bank transfer esetén a payment state és az order state szétválik, és a callback / sync flow frissíti őket.
- A checkout flow ma támogat `coupon`, `notes` és `paymentProvider` mezőket is.
