# Account, Blog, And Public Content Sequences

## AccountSettingsService.saveProviderSettings

```mermaid
sequenceDiagram
  participant UI
  participant AccountSettingsService
  participant AppSyncGraphQL as "Amplify Data GraphQL"

  UI->>AccountSettingsService: saveProviderSettings(input)
  AccountSettingsService->>AppSyncGraphQL: upsertUserProfile(input)
  AppSyncGraphQL-->>AccountSettingsService: UserProfile
  AccountSettingsService-->>UI: { kind: success }
```

## AccountSettingsService.saveInvestorSettings

```mermaid
sequenceDiagram
  participant UI
  participant AccountSettingsService
  participant AppSyncGraphQL as "Amplify Data GraphQL"

  UI->>AccountSettingsService: saveInvestorSettings(input)
  AccountSettingsService->>AppSyncGraphQL: upsertUserProfile(input)
  AppSyncGraphQL-->>AccountSettingsService: UserProfile
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
  participant AppSyncGraphQL as "Amplify Data GraphQL"

  UI->>BlogPostAdminService: loadPosts()
  BlogPostAdminService->>AppSyncGraphQL: listBlogPosts()
  AppSyncGraphQL-->>BlogPostAdminService: BlogPost[]
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
  participant AppSyncGraphQL as "Amplify Data GraphQL"
  participant StorageUpload

  UI->>BlogPostAdminService: save({ values, coverFile })
  BlogPostAdminService->>BlogPostAdminService: validate(input)
  BlogPostAdminService->>AppSyncGraphQL: saveBlogPost(post)
  AppSyncGraphQL-->>BlogPostAdminService: BlogPost
  opt coverFile present
    BlogPostAdminService->>StorageUpload: uploadCoverImage(postId, file)
    StorageUpload-->>BlogPostAdminService: coverImagePath
    BlogPostAdminService->>AppSyncGraphQL: saveBlogPost(updatedPost)
    AppSyncGraphQL-->>BlogPostAdminService: BlogPost
  end
  BlogPostAdminService-->>UI: BlogPost
```

## BlogPostAdminService.delete

```mermaid
sequenceDiagram
  participant UI
  participant BlogPostAdminService
  participant AppSyncGraphQL as "Amplify Data GraphQL"

  UI->>BlogPostAdminService: delete(postId)
  BlogPostAdminService->>AppSyncGraphQL: deleteBlogPost(postId)
  AppSyncGraphQL-->>BlogPostAdminService: void
  BlogPostAdminService-->>UI: void
```

## publicContent.listPublicListings

```mermaid
sequenceDiagram
  participant UI
  participant publicContent
  participant AppSyncGraphQL as "Amplify Data GraphQL"

  UI->>publicContent: listPublicListings()
  publicContent->>AppSyncGraphQL: listOpenListingsWithAssets()
  AppSyncGraphQL-->>publicContent: PublicListingWithAsset[]
  publicContent-->>UI: PublicListingWithAsset[]
```

## publicContent.getPublicListingDetails

```mermaid
sequenceDiagram
  participant UI
  participant publicContent
  participant AppSyncGraphQL as "Amplify Data GraphQL"

  UI->>publicContent: getPublicListingDetails(listingId)
  publicContent->>AppSyncGraphQL: getOpenListingWithAssetById(listingId)
  publicContent->>AppSyncGraphQL: listProductsByListingId(listingId)
  AppSyncGraphQL-->>publicContent: listingWithAsset, products
  publicContent-->>UI: listingWithAsset, products
```

## publicContent.listPublicBlogPosts

```mermaid
sequenceDiagram
  participant UI
  participant publicContent
  participant AppSyncGraphQL as "Amplify Data GraphQL"

  UI->>publicContent: listPublicBlogPosts()
  publicContent->>AppSyncGraphQL: listPublicBlogPosts()
  AppSyncGraphQL-->>publicContent: BlogPost[]
  publicContent-->>UI: BlogPost[]
```

## publicContent.getPublicBlogPost

```mermaid
sequenceDiagram
  participant UI
  participant publicContent
  participant AppSyncGraphQL as "Amplify Data GraphQL"

  UI->>publicContent: getPublicBlogPost(blogId)
  publicContent->>AppSyncGraphQL: getPublicBlogPost(blogId)
  AppSyncGraphQL-->>publicContent: BlogPost | null
  publicContent-->>UI: BlogPost | null
```

## publicContent.getInvestorOrderEntry

```mermaid
sequenceDiagram
  participant UI
  participant publicContent
  participant AppSyncGraphQL as "Amplify Data GraphQL"

  UI->>publicContent: getInvestorOrderEntry(orderId)
  publicContent->>AppSyncGraphQL: getOrder(orderId)
  publicContent->>AppSyncGraphQL: getPublicListingById(order.listingId)
  AppSyncGraphQL-->>publicContent: Order, PublicListingWithAsset
  publicContent-->>UI: order, listingWithAsset
```
