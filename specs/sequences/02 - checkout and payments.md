# Checkout And Payments Sequences

## CheckoutService.loadCheckout

```mermaid
sequenceDiagram
  participant InvestPage as "Invest.tsx"
  participant CheckoutService
  participant AppSyncGraphQL as "Amplify Data GraphQL"
  participant checkoutRules

  Note over InvestPage,CheckoutService: Trigger: page load / route change
  InvestPage->>CheckoutService: loadCheckout(input)
  CheckoutService->>AppSyncGraphQL: getListing(listingId)
  CheckoutService->>AppSyncGraphQL: getAsset(assetId)
  CheckoutService->>AppSyncGraphQL: listProductsByListingId(listingId)
  CheckoutService->>checkoutRules: getSelectedCheckoutProduct(products, requestedProductId)
  checkoutRules-->>CheckoutService: Product | null
  CheckoutService->>checkoutRules: getDefaultCheckoutQuantity(product, initialQuantity)
  checkoutRules-->>CheckoutService: quantity
  CheckoutService->>checkoutRules: getDefaultCheckoutPaymentType(asset, requestedPaymentType)
  checkoutRules-->>CheckoutService: paymentType
  CheckoutService->>checkoutRules: getCheckoutPaymentOptions(asset)
  checkoutRules-->>CheckoutService: CheckoutPaymentOption[]
  CheckoutService->>AppSyncGraphQL: getUserProfile(asset.tenantUserId)
  CheckoutService-->>InvestPage: listing, asset, products, providerName, selectedProductId, quantity, paymentType, paymentOptions
```

## Checkout End-to-End

```mermaid
sequenceDiagram
  participant InvestPage as "Invest.tsx"
  participant CheckoutService
  participant checkoutRules
  participant InvestmentPlatformService
  participant AppSyncGraphQL as "Amplify Data GraphQL"
  participant PowensAPI as "POST /api/powens/create-payment"

  Note over InvestPage,CheckoutService: Trigger: user clicks "Place Order"
  InvestPage->>CheckoutService: submitCheckout(input)
  CheckoutService->>checkoutRules: getCheckoutSubmissionError(input)
  alt validation error
    checkoutRules-->>CheckoutService: error
    CheckoutService-->>InvestPage: { kind: error, message }
  else valid
    CheckoutService->>InvestmentPlatformService: startOrder(input)
    InvestmentPlatformService->>AppSyncGraphQL: getUserProfile(investorId)
    AppSyncGraphQL-->>InvestmentPlatformService: UserProfile
    InvestmentPlatformService->>AppSyncGraphQL: getListing(listingId)
    AppSyncGraphQL-->>InvestmentPlatformService: Listing
    InvestmentPlatformService->>AppSyncGraphQL: getProduct(productId)
    AppSyncGraphQL-->>InvestmentPlatformService: Product
    InvestmentPlatformService->>AppSyncGraphQL: getAsset(listing.assetId)
    AppSyncGraphQL-->>InvestmentPlatformService: Asset
    InvestmentPlatformService->>AppSyncGraphQL: createOrder(pending order)
    AppSyncGraphQL-->>InvestmentPlatformService: Order
    InvestmentPlatformService-->>CheckoutService: Order
    alt paymentType == bank-transfer
      CheckoutService->>PowensAPI: create payment(order.id, accessToken)
      PowensAPI-->>CheckoutService: { redirectUrl }
      CheckoutService-->>InvestPage: { kind: redirect, url }
    else paymentType == card
      CheckoutService-->>InvestPage: { kind: success, orderId }
    end
  end
```

## POST /api/powens/create-payment

```mermaid
sequenceDiagram
  participant Client
  participant CreatePaymentAPI as "POST /api/powens/create-payment"
  participant VerifyToken as "verifyAccessToken"
  participant AppSyncGraphQL as "Amplify Data GraphQL"
  participant PowensAuth as "Powens auth/token"
  participant PowensPayments as "Powens /payments"
  participant PowensScopedToken as "Powens /payments/{id}/scopedtoken"

  Client->>CreatePaymentAPI: POST { orderId } + bearer access token
  CreatePaymentAPI->>VerifyToken: verifyAccessToken(token)
  VerifyToken-->>CreatePaymentAPI: user payload

  CreatePaymentAPI->>AppSyncGraphQL: getOrder(orderId) with Authorization: bearer token
  AppSyncGraphQL-->>CreatePaymentAPI: Order
  alt order missing / wrong user / wrong provider
    CreatePaymentAPI-->>Client: 4xx error
  else bank-transfer order owned by caller
    CreatePaymentAPI->>AppSyncGraphQL: getListing(order.listingId)
    AppSyncGraphQL-->>CreatePaymentAPI: Listing
    CreatePaymentAPI->>AppSyncGraphQL: getAsset(listing.assetId)
    AppSyncGraphQL-->>CreatePaymentAPI: Asset
    alt missing asset or beneficiary details
      CreatePaymentAPI-->>Client: 4xx error
    else ready to create payment
      CreatePaymentAPI->>PowensAuth: fetch admin token(scope=payments:admin)
      PowensAuth-->>CreatePaymentAPI: admin access token
      CreatePaymentAPI->>PowensPayments: create payment(client_redirect_uri, client_state, instructions)
      PowensPayments-->>CreatePaymentAPI: paymentId + payment state
      alt Powens payment creation failed
        CreatePaymentAPI-->>Client: 502 error
      else payment created
        CreatePaymentAPI->>AppSyncGraphQL: updateOrder(paymentProviderId, paymentProviderStatus)
        AppSyncGraphQL-->>CreatePaymentAPI: Order updated
        CreatePaymentAPI->>PowensScopedToken: fetch payment scoped token(scope=payments:validate)
        PowensScopedToken-->>CreatePaymentAPI: payment scoped token
        CreatePaymentAPI-->>Client: { redirectUrl, paymentId }
      end
    end
  end
```

## PowensPaymentSync.pullFromCallbackUi

```mermaid
sequenceDiagram
  participant CallbackPage as "Powens callback UI"
  participant PaymentStatusAPI as "POST /api/powens/payment-status"
  participant VerifyToken as "verifyAccessToken"
  participant AppSyncGraphQL as "Amplify Data GraphQL"
  participant PowensAPI

  CallbackPage->>PaymentStatusAPI: POST with bearer token + { orderId }
  PaymentStatusAPI->>VerifyToken: verifyAccessToken(token)
  VerifyToken-->>PaymentStatusAPI: user payload
  PaymentStatusAPI->>AppSyncGraphQL: getOrder(id) with Authorization: bearer token
  AppSyncGraphQL-->>PaymentStatusAPI: Order
  PaymentStatusAPI->>PowensAPI: GET /payments/{paymentProviderId}
  PowensAPI-->>PaymentStatusAPI: payment state
  PaymentStatusAPI->>AppSyncGraphQL: updateOrder(status, paymentProviderStatus) with Authorization: bearer token
  AppSyncGraphQL-->>PaymentStatusAPI: Order
  PaymentStatusAPI-->>CallbackPage: { paymentState, orderStatus }
```

## PowensPaymentSync.pushFromPowensWebhook

```mermaid
sequenceDiagram
  participant Powens
  participant WebhookAPI as "POST /api/powens/webhook"
  participant PowensPaymentSyncService
  participant InvestmentPlatformService
  participant AppSyncGraphQL as "Amplify Data GraphQL"

  Powens->>WebhookAPI: payment webhook { id, state } + signature headers
  WebhookAPI->>WebhookAPI: verify webhook signature
  alt invalid signature or invalid payload
    WebhookAPI-->>Powens: 4xx / 202
  else valid payment webhook
    WebhookAPI->>PowensPaymentSyncService: syncByPaymentProviderId(paymentProviderId, paymentState)
    PowensPaymentSyncService->>AppSyncGraphQL: findOrderByPaymentProviderId(paymentProviderId)
    AppSyncGraphQL-->>PowensPaymentSyncService: Order
    alt no matching order
      PowensPaymentSyncService-->>WebhookAPI: null
      WebhookAPI-->>Powens: 202 accepted
    else payment state resolves to paid and order pending
      PowensPaymentSyncService->>InvestmentPlatformService: completeOrderPayment(orderId)
      InvestmentPlatformService->>AppSyncGraphQL: getOrder(orderId)
      InvestmentPlatformService->>AppSyncGraphQL: getProduct(productId)
      InvestmentPlatformService->>AppSyncGraphQL: updateProduct(remainingSupply)
      InvestmentPlatformService->>AppSyncGraphQL: updateOrder(status=paid)
      AppSyncGraphQL-->>PowensPaymentSyncService: Order
      PowensPaymentSyncService->>AppSyncGraphQL: updateOrder(paymentProviderStatus)
      AppSyncGraphQL-->>PowensPaymentSyncService: Order
      PowensPaymentSyncService-->>WebhookAPI: Order
      WebhookAPI-->>Powens: 200 received
    else any other mapped payment state
      PowensPaymentSyncService->>AppSyncGraphQL: updateOrder(status, paymentProviderStatus)
      AppSyncGraphQL-->>PowensPaymentSyncService: Order
      PowensPaymentSyncService-->>WebhookAPI: Order
      WebhookAPI-->>Powens: 200 received
    end
  end
```
