# Image handling

## Overview

A projektben a képek és egyes fájlok Amplify Storage-on keresztül mennek S3-ba, és a publikus képek olvasása CloudFront CDN-en keresztül történik.

A rendszer három fő storage prefixet használ:

- `public/assets/*`
  asset képek
- `public/blog/*`
  blog cover képek
- `private/assets/*`
  asset dokumentumok

## Bucket létrejötte

A bucketet az Amplify Gen 2 storage resource hozza létre:

- [amplify/storage/resource.ts](/Users/kukodajanos/Workspace/cityzeen-tdd/amplify/storage/resource.ts)

Ez magas szintű Amplify deklaratív storage definíció:

```ts
defineStorage({
  name: "assetStorage",
  access: ...
})
```

Ez végül CloudFormation/CDK resource-okra fordul le, de a bucket létrehozását nem manuálisan, hanem az Amplify backend deploy végzi.

## Path-alapú jogosultságok

A storage access szabályok itt vannak:

- [amplify/storage/resource.ts](/Users/kukodajanos/Workspace/cityzeen-tdd/amplify/storage/resource.ts)

Jelenlegi szabályok:

- `public/assets/*`
  - `guest`: `read`
  - `authenticated`: `read`, `write`, `delete`
- `public/blog/*`
  - `guest`: `read`
  - `authenticated`: `read`, `write`, `delete`
- `private/assets/*`
  - `authenticated`: `read`, `write`, `delete`

Ez azt jelenti:

- asset képeket és blog covereket vendég is olvashat
- írás/törlés csak bejelentkezett usernek engedett
- private asset dokumentumokat vendég nem olvashatja

## Bucket CORS és CDN finomhangolás

Ez már nem a `defineStorage(...)` magas szintű API-ban van, hanem közvetlen CDK override-ban:

- [amplify/backend.ts](/Users/kukodajanos/Workspace/cityzeen-tdd/amplify/backend.ts)

Itt történik:

1. Cognito resource naming override
2. Storage bucket CORS override
3. CloudFront CDN létrehozása a bucket elé

### CloudFront

A CloudFront itt jön létre:

- [amplify/backend.ts](/Users/kukodajanos/Workspace/cityzeen-tdd/amplify/backend.ts)

```ts
const storageCdn = new Distribution(...)
```

Ez deploy során jön létre, nem manuálisan.

### OAI

Az OAI (`OriginAccessIdentity`) egy CloudFront identity, aminek bucket read jogot adunk:

```ts
const storageOai = new OriginAccessIdentity(...)
backend.storage.resources.bucket.grantRead(storageOai)
```

Fontos:

- ez a read jog a teljes bucketre vonatkozik
- nem csak egy prefixre
- de alkalmazás szinten a publikus használat főleg a `public/*` pathokra korlátozódik

### CORS

A bucket CORS itt van override-olva:

```ts
backend.storage.resources.cfnResources.cfnBucket.corsConfiguration = ...
```

Miért kell:

- a böngésző közvetlenül S3-ba tölt fel
- például asset kép uploadnál
- ehhez a bucketnek engednie kell az adott web originről jövő kéréseket

Jelenlegi allowed originok:

- `http://localhost:3000`
- `https://localhost:3001`
- `process.env.APP_URL`

Ha ez nincs jól beállítva, tipikus hiba:

- preflight `403`
- az upload el sem indul

## Tárolt path formátumok

A path prefix helper-ek itt vannak:

- [src/infrastructure/storage/publicUrls.ts](/Users/kukodajanos/Workspace/cityzeen-tdd/src/infrastructure/storage/publicUrls.ts)

Jelenlegi prefixek:

- `assetImagePrefix(assetId)` -> `public/assets/${assetId}/images/`
- `assetDocPrefix(assetId)` -> `private/assets/${assetId}/docs/`
- `blogCoverPrefix(postId)` -> `public/blog/${postId}/cover/`

## Hogyan írjuk a képeket

### Asset képek

Step 2 és asset detail oldalon az upload `uploadData(...)`-val megy:

- [app/asset-provider/assets/new/Step2PageContent.tsx](/Users/kukodajanos/Workspace/cityzeen-tdd/app/asset-provider/assets/new/Step2PageContent.tsx)
- [app/asset-provider/assets/[assetId]/AssetProviderAsset.tsx](/Users/kukodajanos/Workspace/cityzeen-tdd/app/asset-provider/assets/%5BassetId%5D/AssetProviderAsset.tsx)

Flow:

1. kliensoldali `uploadData(...)`
2. cél path a `public/assets/<assetId>/images/...`
3. az asset rekord `imageUrls` mezőjébe a tárolt public path kerül
4. mentés az asset rekordra

Az asset repository a mentett pathokat normalizálja:

- [src/infrastructure/repositories/amplifyAssetRepository.ts](/Users/kukodajanos/Workspace/cityzeen-tdd/src/infrastructure/repositories/amplifyAssetRepository.ts)

Használt helper:

- `normalizeStoredPublicPath(...)`

### Blog cover kép

Admin blog oldalon a cover kép upload is kliensoldali `uploadData(...)`:

- [app/platform-admin/blog-posts/page.tsx](/Users/kukodajanos/Workspace/cityzeen-tdd/app/platform-admin/blog-posts/page.tsx)

Path:

- `public/blog/<postId>/cover/...`

A mentett `coverImage` mező szintén normalizált public pathként tárolódik:

- [src/infrastructure/repositories/amplifyBlogRepository.ts](/Users/kukodajanos/Workspace/cityzeen-tdd/src/infrastructure/repositories/amplifyBlogRepository.ts)

### Private dokumentumok

Az asset dokumentumok private prefixre mennek:

- [app/asset-provider/assets/new/Step3PageContent.tsx](/Users/kukodajanos/Workspace/cityzeen-tdd/app/asset-provider/assets/new/Step3PageContent.tsx)

Path:

- `private/assets/<assetId>/docs/...`

Ezek nem CDN-es publikus képek, hanem autholt dokumentumok.

## Hogyan olvassuk a képeket

A nyers tárolt `public/...` pathból publikus CDN URL lesz:

- [src/infrastructure/storage/publicUrls.ts](/Users/kukodajanos/Workspace/cityzeen-tdd/src/infrastructure/storage/publicUrls.ts)

Fő helper:

- `toPublicStorageUrl(value)`

Logika:

1. kinyeri a `public/...` pathot
2. ha van `custom.storageCdnUrl` az `amplify_outputs.json`-ban
3. abból csinál teljes URL-t:
   - `https://<cloudfront-domain>/public/...`

Tömbös változat:

- `toPublicStorageUrls(values)`

## Hol konfiguráljuk a CDN URL-t

A CDN URL az Amplify output custom mezőjébe kerül:

- [amplify/backend.ts](/Users/kukodajanos/Workspace/cityzeen-tdd/amplify/backend.ts)

```ts
backend.addOutput({
  custom: {
    storageCdnUrl: `https://${storageCdn.domainName}`,
  },
});
```

Ezt olvassa a runtime:

- [src/infrastructure/storage/publicUrls.ts](/Users/kukodajanos/Workspace/cityzeen-tdd/src/infrastructure/storage/publicUrls.ts)

## Runtime Amplify config

A frontend az `amplify_outputs.json` alapján konfigurálódik:

- [src/config/amplify.ts](/Users/kukodajanos/Workspace/cityzeen-tdd/src/config/amplify.ts)

```ts
Amplify.configure(outputs, { ssr: typeof window === "undefined" });
```

Tehát a storage, auth, data és custom outputok ugyanabból a generált configból jönnek.

## Rövid összefoglaló

- bucket létrehozás: Amplify `defineStorage`
- path access szabályok: Amplify storage access config
- CORS: CDK override a `backend.ts`-ben
- CloudFront CDN: CDK override a `backend.ts`-ben
- publikus asset/blog képek:
  - `public/...` pathként tároljuk
  - CloudFront URL-re fordítjuk
- private dokumentumok:
  - `private/...` pathon maradnak
  - nem publikus CDN assetként kezeljük
