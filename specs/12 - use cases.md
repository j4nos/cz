# Main use cases

## InvestmentPlatformService

- `createAsset`
  Létrehoz egy új assetet alap adatokkal.
- `createListing`
  Létrehoz egy új listing draftot egy assethez.
- `saveListing`
  Elmenti a listing módosításait.
- `createProduct`
  Létrehoz egy új befektetési productot egy listinghez.
- `saveProduct`
  Elmenti egy product módosításait.
- `startOrder`
  Elindít egy ordert a kiválasztott listingre és productra.
- `completeOrderPayment`
  A pending ordert paid állapotba teszi.

## CheckoutService

- `loadCheckout`
  Betölti a checkout oldalhoz szükséges listing, asset, product és provider adatokat.
- `submitCheckout`
  Végigviszi az order indítás flow-t, és eldönti, hogy success, login redirect vagy Powens redirect legyen az eredmény.

## ContractDeploymentService

- `loadAssetReview`
  Betölti a step-4 review oldal asset adatait, és visszaadja a wizard state patch-et is.
- `submit`
  Ellenőrzi a contract deployment feltételeit, szükség esetén deployol, majd frissíti az assetet.

## OwnershipMintingService

- `resolveContext`
  Feloldja az orderhez tartozó listinget, assetet és token címet.
- `mint`
  Végigviszi a withdraw / ownership minting flow-t, és visszaadja a UI-nak a sikeres vagy hibás eredményt.

## AccountSettingsService

- `saveProviderSettings`
  Elmenti az asset provider profilbeállításokat.
- `saveInvestorSettings`
  Elmenti az investor profilbeállításokat.
- `deleteAccount`
  Elindítja az account törlést access token alapján.

## BlogPostAdminService

- `loadPosts`
  Betölti a blog post listát admin használatra.
- `validate`
  Ellenőrzi, hogy a blog post mentéshez minden szükséges mező megvan-e.
- `save`
  Elmenti a blog postot, és ha kell, feltölti a cover képet is.
- `delete`
  Törli a kiválasztott blog postot.

## PowensPaymentSyncService

- `syncByPaymentProviderId`
  Webhookból érkező Powens payment state alapján megkeresi az ordert, és frissíti a payment státuszt.
- `syncByOrderId`
  Egy meglévő orderhez lekért Powens payment state alapján frissíti az order állapotát.

## Public content use cases

- `listPublicListings`
  Visszaadja a publikus listing listát asset adatokkal.
- `getPublicListingDetails`
  Betölti egy listing publikus részletadatait.
- `listPublicBlogPosts`
  Visszaadja a publikus blog listaoldal adatait.
- `getPublicBlogPost`
  Betölti egy blog post részletoldalát.
- `getInvestorOrderEntry`
  Betölti az investor order oldalhoz szükséges publikus listing és order kontextust.

## Smaller rule / helper use cases

- `listingOpenRequirements`
  Megmondja, mi a következő hiányzó feltétel ahhoz, hogy egy closed listing open lehessen.
- `checkoutRules`
  Checkout payment option, default product, default quantity és submit validációs szabályok.
- `contractDeploymentRules`
  Contract standard, deploy szükségesség és deploy utáni asset állapot szabályai.
- `ownershipMinting`
  Ownership mint request payload és success message szabályok.
- `pricingRules`
  Product pricing és tier validációs szabályok.
- `assetUpdateAssembler`
  Asset update payload és image path merge segédfüggvények.
