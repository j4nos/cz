# Account, Blog, And Public Content Sequences

## 1. Provider Settings Save

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

## 2. Investor Settings Save

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

## 3. Account Deletion

```mermaid
sequenceDiagram
  participant UI
  participant AccountSettingsService
  participant DeleteAccountClient as "account HTTP client"
  participant DeleteAccountAPI as "POST /api/account/delete"
  participant VerifyToken as "verifyAccessToken"
  participant DeleteAccountService
  participant AmplifyInvestmentRepository
  participant CognitoAccountAdminClient

  UI->>AccountSettingsService: deleteAccount(accessToken)
  AccountSettingsService->>DeleteAccountClient: deleteCurrentAccount(accessToken)
  DeleteAccountClient->>DeleteAccountAPI: POST with bearer token
  DeleteAccountAPI->>VerifyToken: verifyAccessToken(token)
  VerifyToken-->>DeleteAccountAPI: user payload
  DeleteAccountAPI->>DeleteAccountService: deleteAccount({ userId, email, userPoolId, region })
  DeleteAccountService->>AmplifyInvestmentRepository: deleteUserProfile(userId)
  DeleteAccountService->>CognitoAccountAdminClient: deleteUser(userId)
  opt user id delete fails and email exists
    DeleteAccountService->>CognitoAccountAdminClient: deleteUser(email)
  end
  DeleteAccountService-->>DeleteAccountAPI: void
  DeleteAccountAPI-->>DeleteAccountClient: void
  DeleteAccountClient-->>AccountSettingsService: void
  AccountSettingsService-->>UI: { kind: success }
```

## 4. Blog Post Load

```mermaid
sequenceDiagram
  participant UI
  participant BlogPostAdminService
  participant AmplifyInvestmentRepository

  UI->>BlogPostAdminService: loadPosts()
  BlogPostAdminService->>AmplifyInvestmentRepository: listBlogPosts()
  AmplifyInvestmentRepository-->>BlogPostAdminService: BlogPost[]
  BlogPostAdminService-->>UI: BlogPost[]
```

## 5. Blog Post Validation

```mermaid
sequenceDiagram
  participant UI
  participant BlogPostAdminService

  UI->>BlogPostAdminService: validate({ values, coverFile })
  BlogPostAdminService-->>UI: error | undefined
```

## 6. Blog Post Save

```mermaid
sequenceDiagram
  participant UI
  participant BlogPostAdminService
  participant AmplifyInvestmentRepository
  participant StorageUpload

  UI->>BlogPostAdminService: save({ values, coverFile })
  BlogPostAdminService->>BlogPostAdminService: validate(input)
  BlogPostAdminService->>AmplifyInvestmentRepository: saveBlogPost(post)
  AmplifyInvestmentRepository-->>BlogPostAdminService: BlogPost
  opt coverFile present
    BlogPostAdminService->>StorageUpload: uploadCoverImage(postId, file)
    StorageUpload-->>BlogPostAdminService: coverImagePath
    BlogPostAdminService->>AmplifyInvestmentRepository: saveBlogPost(updatedPost)
    AmplifyInvestmentRepository-->>BlogPostAdminService: BlogPost
  end
  BlogPostAdminService-->>UI: BlogPost
```

## 7. Blog Post Delete

```mermaid
sequenceDiagram
  participant UI
  participant BlogPostAdminService
  participant AmplifyInvestmentRepository

  UI->>BlogPostAdminService: delete(postId)
  BlogPostAdminService->>AmplifyInvestmentRepository: deleteBlogPost(postId)
  AmplifyInvestmentRepository-->>BlogPostAdminService: void
  BlogPostAdminService-->>UI: void
```

## 8. Public Listings

```mermaid
sequenceDiagram
  participant UI
  participant publicContent
  participant PublicContentReader
  participant AmplifyInvestmentRepository as "AmplifyInvestmentRepository (apiKey)"

  UI->>publicContent: listPublicListings()
  publicContent->>PublicContentReader: listOpenListingsWithAssets()
  PublicContentReader->>AmplifyInvestmentRepository: listListings(), listAssets()
  AmplifyInvestmentRepository-->>PublicContentReader: Listing[], Asset[]
  PublicContentReader-->>publicContent: PublicListingWithAsset[]
  publicContent-->>UI: PublicListingWithAsset[]
```

## 9. Public Listing Details

```mermaid
sequenceDiagram
  participant UI
  participant publicContent
  participant PublicContentReader
  participant AmplifyInvestmentRepository as "AmplifyInvestmentRepository (apiKey)"

  UI->>publicContent: getPublicListingDetails(listingId)
  publicContent->>PublicContentReader: getOpenListingWithAssetById(listingId)
  PublicContentReader->>AmplifyInvestmentRepository: getListingById(listingId)
  PublicContentReader->>AmplifyInvestmentRepository: getAssetById(assetId)
  AmplifyInvestmentRepository-->>PublicContentReader: Listing, Asset
  publicContent->>PublicContentReader: listProductsByListingId(listingId)
  PublicContentReader->>AmplifyInvestmentRepository: listProductsByListingId(listingId)
  AmplifyInvestmentRepository-->>PublicContentReader: Product[]
  PublicContentReader-->>publicContent: listingWithAsset, products
  publicContent-->>UI: listingWithAsset, products
```

## 10. Public Blog List

```mermaid
sequenceDiagram
  participant UI
  participant publicContent
  participant PublicContentReader
  participant AmplifyInvestmentRepository as "AmplifyInvestmentRepository (apiKey)"

  UI->>publicContent: listPublicBlogPosts()
  publicContent->>PublicContentReader: listPublishedBlogPosts()
  PublicContentReader->>AmplifyInvestmentRepository: listPublishedBlogPosts()
  AmplifyInvestmentRepository-->>PublicContentReader: BlogPost[]
  PublicContentReader-->>publicContent: BlogPost[]
  publicContent-->>UI: BlogPost[]
```

## 11. Public Blog Details

```mermaid
sequenceDiagram
  participant UI
  participant publicContent
  participant PublicContentReader
  participant AmplifyInvestmentRepository as "AmplifyInvestmentRepository (apiKey)"

  UI->>publicContent: getPublicBlogPost(blogId)
  publicContent->>PublicContentReader: getPublishedBlogPostById(blogId)
  PublicContentReader->>AmplifyInvestmentRepository: listPublishedBlogPosts()
  AmplifyInvestmentRepository-->>PublicContentReader: BlogPost[]
  PublicContentReader-->>publicContent: BlogPost | null
  publicContent-->>UI: BlogPost | null
```

## 12. Investor Order Entry

```mermaid
sequenceDiagram
  participant UI
  participant publicContent
  participant PublicContentReader
  participant AmplifyInvestmentRepository as "AmplifyInvestmentRepository (apiKey)"

  UI->>publicContent: getInvestorOrderEntry(orderId)
  publicContent->>PublicContentReader: getOrderById(orderId)
  PublicContentReader->>AmplifyInvestmentRepository: getOrderById(orderId)
  AmplifyInvestmentRepository-->>PublicContentReader: Order
  publicContent->>PublicContentReader: getListingWithAssetById(order.listingId)
  publicContent->>PublicContentReader: getProductById(order.productId)
  PublicContentReader->>AmplifyInvestmentRepository: getListingById(order.listingId), getAssetById(assetId), getProductById(productId)
  AmplifyInvestmentRepository-->>PublicContentReader: Listing, Asset, Product
  PublicContentReader-->>publicContent: order, listingWithAsset, product
  publicContent-->>UI: order, listingWithAsset, product
```
