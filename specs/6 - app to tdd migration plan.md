# Cityzeen app to TDD migration plan

## Goal

Migrate `cityzeen-app` into `cityzeen-tdd` while keeping:

- clean architecture as the primary structure
- Amplify Data as the source of truth
- Amplify Auth as the target auth layer
- the current UI, CSS, chat, tokenization, and Solidity workflow

The old `cityzeen-app/lib` shape must not reappear in `cityzeen-tdd`.

## Current architecture

```text
cityzeen-tdd/
  app/
    api/
      chat/route.ts
      tokenize-asset/route.ts
    ...
  components/
    asset-provider/
    blog/
    chat/
    platform-admin/
    toast/
    ui/
  contexts/
    AssetWizardContext.tsx
    AuthContext.tsx
    LoadingContext.tsx
    ToastContext.tsx
  src/
    application/
      chatPorts.ts
      chatService.ts
      assetController.ts
      listingController.ts
      orderController.ts
      pricingController.ts
      readController.ts
      pricingState.ts
      publicContent.ts
      tokenizationPorts.ts
      tokenizationService.ts
      ...
    domain/
      chat.ts
      entities.ts
      tokenization.ts
      ...
    infrastructure/
      amplify/
        config.ts
        pagination.ts
        schemaMappers.ts
      auth/
        amplifyAuthClient.ts
        createAuthClient.ts
      gateways/
        ethersTokenizationGateway.ts
        ruleBasedChatGateway.ts
      repositories/
        amplifyChatRepository.ts
        amplifyInvestmentRepository.ts
        amplifyPublicContentReader.ts
        createPublicContentReader.ts
      controllers/
        amplify*.ts
        create*.ts
      inMemoryInvestmentRepository.ts
  amplify/
    data/resource.ts
  contracts/
  artifacts/
  tests/
```

## Hard rules

- React components must not import Amplify clients directly.
- React components must not import `ethers`, OpenAI SDKs, or storage SDK code directly.
- Next route handlers are transport adapters only.
- Business rules stay in `src/domain` and `src/application`.
- Amplify Data models are persistence models, not domain models.
- Mapping between Amplify records and domain entities must be explicit.

## Controller model

The app no longer uses a monolithic `DataContext` or browser controller.

Instead:

- server components use `publicContent.ts` through `createPublicContentReader()`
- authenticated client reads use `createReadController()`
- writes are split by concern:
  - `createAssetController()`
  - `createListingController()`
  - `createPricingController()`
  - `createOrderController()`
- auth is accessed through `AuthContext`, backed by `createAuthClient()`
- chat and tokenization use dedicated application services plus infrastructure adapters

Each controller factory resolves to an Amplify-backed implementation. Development and app runtime both use the same GraphQL plus DynamoDB path.

## Migration status

Completed:

- UI foundation, navbar, footer, hero, blog, investor, asset-provider, and admin presentation migration
- chat vertical slice:
  - `src/domain/chat.ts`
  - `src/application/chatPorts.ts`
  - `src/application/chatService.ts`
  - `app/api/chat/route.ts`
- tokenization vertical slice:
  - `src/domain/tokenization.ts`
  - `src/application/tokenizationPorts.ts`
  - `src/application/tokenizationService.ts`
  - `app/api/tokenize-asset/route.ts`
  - `src/infrastructure/gateways/ethersTokenizationGateway.ts`
- Amplify Data schema expansion in `amplify/data/resource.ts`
- Amplify repository layer in `src/infrastructure/repositories`
- auth abstraction and provider-backed controller layer
- sandbox seeding through `scripts/seedAmplifySandbox.ts`
- removal of the old `DataContext` and singleton-based app runtime

Still in progress:

- expanding tests around Amplify-backed controllers and route adapters
- moving more admin/controller state behind dedicated clean application contracts

## What migrates directly from cityzeen-app

Usually with import cleanup only:

- `components/ui`
- `components/blog`
- `components/platform-admin`
- `components/chat`
- `components/asset-provider`
- `components/toast`
- `app/**/*.tsx` pages
- `public`
- `contracts`
- `artifacts`
- `app/globals.css`

Transport adapters:

- `app/api/chat/route.ts`
- `app/api/tokenize-asset/route.ts`

## What must be rewritten

Do not copy these as-is:

- `cityzeen-app/lib/domain/*`
- `cityzeen-app/lib/application/*`
- `cityzeen-app/lib/data/*`
- `cityzeen-app/lib/infra/*`
- `cityzeen-app/lib/auth/*`
- `cityzeen-app/lib/ai/*`
- `cityzeen-app/lib/env.ts`

They must be reclassified into:

- `src/domain`
- `src/application`
- `src/infrastructure`

## Recommended next steps

1. Add focused tests for client controller factories and Amplify-backed command/read paths.
2. Continue moving admin/controller state into dedicated controller contracts.

## Acceptance criteria

The migration is done when:

- `cityzeen-tdd` remains the only active codebase
- no `lib` directory is needed
- no production flow depends on a controller singleton or `DataContext`
- no app flow depends on browser-store fallback repositories
- public reads, authenticated reads, and writes all go through clean controller boundaries
- chat works through clean architecture ports and adapters
- tokenization works through a tokenization gateway
- Amplify Data remains the source of truth
- tests still cover domain and use case behavior independently from Amplify
