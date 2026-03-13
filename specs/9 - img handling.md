# Image Handling

## Goal

Make `cityzeen-tdd` handle image upload and rendering the same way as `cityzeen-app`:

- upload files to Amplify Storage / S3
- store storage paths in Data, not inline data URLs
- resolve public image URLs through the storage CDN
- keep the bucket private behind CDN-style access instead of relying on ad hoc public links

## What Was Wrong Before

- The `tdd` asset page uploaded with `uploadData`, but the UI reused raw storage paths directly.
- The `tdd` blog admin page stored uploaded cover images as `data:` URLs in the database.
- The `tdd` backend definition did not include the storage resource or the CloudFront distribution setup we already use in `app`.
- Image path storage and image URL rendering were mixed together.

## Changes Made

### 1. Added a shared storage URL/path utility

Created:

- `src/infrastructure/storage/publicUrls.ts`

This centralizes:

- storage path prefixes
- safe file name generation
- stored-path normalization
- public CDN URL resolution

Main helpers:

- `assetImagePrefix`
- `blogCoverPrefix`
- `toSafeFileName`
- `extractPublicPath`
- `normalizeStoredPublicPath`
- `toPublicStorageUrl`
- `toPublicStorageUrls`

### 2. Added Amplify Storage backend definition

Created:

- `amplify/storage/resource.ts`

This mirrors the `app` setup:

- `public/assets/*`
- `public/blog/*`
- `private/assets/*`

### 3. Restored storage CDN setup in Amplify backend

Updated:

- `amplify/backend.ts`

Now the `tdd` backend again defines:

- `storage`
- CloudFront distribution in front of the storage bucket
- CORS rules for local web origins
- custom output `storageCdnUrl`

This matches the architectural direction of `app`.

### 4. Normalized how image paths are persisted

Updated:

- `src/infrastructure/repositories/amplifyInvestmentRepository.ts`

Now:

- asset `imageUrls` are stored as storage paths
- blog `coverImage` is stored as a storage path
- if a resolved CDN URL is passed back into the repository, it is normalized back to the underlying `public/...` path before persistence

### 5. Resolved image paths to public URLs when reading

Updated:

- `src/infrastructure/amplify/schemaMappers.ts`

Now:

- asset `imageUrls` are mapped to public CDN URLs for rendering
- blog `coverImage` is mapped to a public CDN URL for rendering

This separates:

- persisted value: storage path
- rendered value: public URL

### 6. Fixed asset photo upload flow

Updated:

- `app/asset-provider/assets/[assetId]/page.tsx`

Now:

- upload still goes through `uploadData`
- existing image values are normalized back to stored paths before update
- UI state is refreshed with resolved public URLs after upload

### 7. Fixed asset wizard step 2 photo upload

Updated:

- `app/asset-provider/assets/new/step-2/page.tsx`

Now step 2:

- uploads actual files to Amplify Storage
- stores uploaded photo references in wizard state as public URLs
- no longer only stores local file names

### 8. Fixed blog cover upload flow

Updated:

- `app/platform-admin/blog-posts/page.tsx`

Now:

- uploaded cover images go to Amplify Storage / S3
- the blog post stores the storage path
- no inline base64 `data:` image is written into the record

## How It Works Now

### Upload

1. Client uploads file with `uploadData(...)`
2. File is written to a `public/...` storage path
3. That storage path is stored in Amplify Data

### Read / Render

1. Data record returns the stored `public/...` path
2. Mapper resolves it to `storageCdnUrl/...`
3. UI renders the CDN URL

## AWS / Permissions

This should be managed through Amplify backend definition, not manual one-off AWS CLI policy edits.

The important part is:

- `amplify/storage/resource.ts` defines who can read/write which paths
- `amplify/backend.ts` defines the CDN and bucket CORS
- then Amplify deploy/sandbox update makes AWS match that definition

So the main operational step is not "set S3 permissions by hand with AWS CLI", but:

1. update Amplify backend definition
2. deploy or refresh the backend
3. regenerate / refresh outputs

AWS CLI is only useful for debugging, not as the primary configuration path here.

## Important Note

The current `amplify_outputs.json` in `tdd` already contains storage and `storageCdnUrl`, while the previous backend definition did not. That was inconsistent.

This change makes the codebase consistent with that storage/CDN model again.
