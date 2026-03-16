# 19 – Teszt ötletek

> A projekt jelenlegi állapota alapján összeállított tesztterv, emberi nyelven.
> Cél: a meglévő 5 tesztfájl (9 teszt eset) kiegészítése, a teljes üzleti logika, API réteg és szabálymodulok lefedése.

---

## Jelenleg lefedett területek

| Fájl | Mit tesztel |
|---|---|
| `basicInvestmentFlow.test.ts` | Alap befektetési folyamat (happy path): regisztráció → eszköz → listing → termék → rendelés → fizetés |
| `chatService.test.ts` | Chat üzenetküldés happy path: user üzenet → AI válasz → thread összefoglaló frissítés |
| `ownershipMintingProcessorService.test.ts` | Minting feldolgozás: queued állapotú kérés → minted |
| `tokenizationService.test.ts` | Tokenizáció: happy path + jogosultság ellenőrzés (más user eszköze) |
| `tokenizeAssetRoute.test.ts` | `/api/tokenize-asset` route: hiányzó paraméterek, hibás konfig, happy path |

---

## 1. Unit tesztek – Üzleti szabálymodulok (pure functions)

Ezek a legegyszerűbb és leggyorsabb tesztek, mert tiszta függvényeket tesztelnek, nincs szükség mock-okra.

### 1.1 checkoutRules
- `isBankTransferAvailable`: igaz legyen ha a termék támogatja, hamis ha nem
- `getCheckoutPaymentOptions`: helyes fizetési opciók visszaadása különböző termék-konfigurációkra
- `getDefaultCheckoutPaymentType`: alapértelmezett fizetési mód kiválasztása
- `getSelectedCheckoutProduct`: a kiválasztott termék helyes visszaadása listing ID alapján
- `getDefaultCheckoutQuantity`: alapértelmezett mennyiség (minimum vásárlási mennyiség)
- `getCheckoutSubmissionError`: hibaüzenetek helyes visszaadása (nincs termék kiválasztva, mennyiség a megengedett tartományon kívül, lejárt listing, stb.)

### 1.2 contractDeploymentRules
- `getContractDeploymentError`: hibaüzenet ha az eszköz nem deployolható (hiányzó adatok, már deployed, stb.)
- `getDesiredContractStandard`: ERC-20 vs ERC-721 helyes meghatározása a tokenStandard mező alapján
- `buildContractSymbol`: szimbólum generálás az eszköz nevéből (max hossz, speciális karakterek kezelése)
- `shouldDeployContract`: igaz ha nincs tokenAddress, hamis ha már van
- `buildContractDeploymentRequest`: helyes deployment request objektum összeállítása
- `buildAssetAfterContractDeployment`: az eszköz frissített állapota deployment után (tokenAddress, status, stb.)

### 1.3 pricingRules
- `getPricingStateError`: hibák felderítése (negatív ár, nulla supply, stb.)
- `getPricingTierInputError`: tier input validáció (negatív kedvezmény, 100% feletti kedvezmény, stb.)
- `buildPricingTier`: helyes tier objektum létrehozása az inputból
- `addPricingTierToState`: új tier hozzáadása – ellenőrizni, hogy rendezetten kerül be
- `removePricingTierFromState`: tier eltávolítása ID alapján

### 1.4 ownershipMinting szabályok
- `getMintOwnershipTokenStandard`: helyes token standard meghatározása (ERC-20 / ERC-721)
- `getMintOwnershipError`: hibaüzenetek (nincs tokenAddress, rendelés nincs fizetve, stb.)
- `buildMintOwnershipRequest`: helyes request objektum felépítése
- `getMintOwnershipSuccessMessage`: sikeres minting utáni üzenet formátuma

### 1.5 listingOpenRequirements
- `getListingOpenRequirementError`: listing megnyitás feltételei – hiányzó fotók, termékek, érvénytelen dátumok

### 1.6 assetUpdateAssembler
- `buildUpdatedAssetBasics`: az eszköz alapadatainak frissítése (név, ország, osztály)
- `mergeAssetImagePaths`: képek összefésülése – meglévő + új képek, törlések kezelése

### 1.7 PricingState DTO
- `createDefaultPricingState`: alapértelmezett állapot létrehozása egy Product-ból

---

## 2. Unit tesztek – Use case-ek / Szolgáltatások

### 2.1 InvestmentPlatformService – negatív esetek
A meglévő happy path teszt kiegészítése:
- `startOrder` elutasítása ha a listing closed állapotú
- `startOrder` elutasítása ha a befektető típusa nem egyezik a termék `eligibleInvestorType` mezőjével
- `startOrder` elutasítása ha a kért mennyiség > `remainingSupply`
- `startOrder` elutasítása ha a kért mennyiség < `minPurchase` vagy > `maxPurchase`
- `completeOrderPayment` elutasítása ha a rendelés nem `pending` állapotú
- `completeOrderPayment` elutasítása ha a rendelés nem létezik
- `createAsset` elutasítása ha a felhasználó nem ASSET_PROVIDER
- `createListing` elutasítása ha az eszköz nem a felhasználóé
- `createProduct` elutasítása ha a listing nem a felhasználóé
- Többszörös rendelés egy listingre: supply csökkenés helyes követése

### 2.2 ChatService – további esetek
- Üzenet küldés nem létező thread-re (új thread létrehozása)
- Thread lista lekérdezés – üres lista
- Thread lista lekérdezés – több thread időrend szerinti rendezése
- Üzenet lista lekérdezés – üres, egy vagy több üzenet

### 2.3 TokenizationService – további esetek
- Tokenizáció ha az eszköznek már van `tokenAddress` (korai visszatérés, nem deployol újra)
- Deployment request már `submitted` állapotban van (idempotencia)
- Gateway hiba (ethers hívás sikertelen) → helyes hibakezelés
- Párhuzamos hívás versenyfeltétel kezelése (claim elutasítás)

### 2.4 OwnershipMintingProcessorService – további esetek
- Már `minted` állapotú kérés → azonnali visszatérés, nem hív gateway-t
- `submitting` vagy `submitted` állapotú kérés → pending visszaadás
- Gateway hiba → `failed` állapot, `retryCount` növelés
- `failed` állapotú kérés újra-claimelésa → újra feldolgozás

### 2.5 CheckoutService
- `loadCheckout`: helyes listing/asset/products/provider feloldás
- `loadCheckout`: nem létező listing → hiba
- `submitCheckout`: kártyás fizetés folyamata
- `submitCheckout`: banki átutalás folyamata
- `submitCheckout`: érvénytelen input (hiányzó termék, rossz mennyiség) → validációs hiba

### 2.6 ContractDeploymentService
- `loadAssetReview`: helyes adat-összeállítás a review oldalhoz
- `submit`: sikeres deploy + eszköz státusz frissítés `submitted`-re
- `submit`: már tokenizált eszköz → deploy kihagyása
- `submit`: validációs hiba (hiányzó mezők) → DomainError

### 2.7 OwnershipMintingService (kliens-oldali)
- `resolveContext`: listing/asset/tokenAddress helyes feloldása
- `mint`: sikeres minting → helyes success toast üzenet
- `mint`: hiba → helyes error toast üzenet

### 2.8 AccountSettingsService
- `saveProviderSettings`: sikeres mentés
- `saveInvestorSettings`: sikeres mentés
- `deleteAccount`: sikeres törlés
- Nem bejelentkezett felhasználó → hiba

### 2.9 BlogPostAdminService
- `loadPosts`: lista lekérés
- `validate`: hibás input → validációs hibák
- `save`: mentés cover képpel és anélkül
- `delete`: sikeres törlés

### 2.10 PowensPaymentSyncService
- `syncByPaymentProviderId` (webhook): Powens „done" → rendelés `paid`
- `syncByPaymentProviderId`: Powens „rejected" → rendelés `failed`
- `syncByPaymentProviderId`: Powens pending állapotok → rendelés marad `pending`
- `syncByOrderId` (polling): ugyanazok az állapot-átmenetek
- Nem létező rendelés → hibakezelés
- Már fizetett rendelés → nem változtat semmit (idempotencia)

---

## 3. Integrációs tesztek – API route-ok

Ezek a tesztek a teljes HTTP kérés-válasz ciklust tesztelik, mockolt külső függőségekkel (Amplify, Cognito, ethers, Powens).

### 3.1 POST /api/tokenize-asset (kiegészítés)
- Meglévő 4 teszt mellé: jogosultság ellenőrzés (más user eszköze → 403)
- Már tokenizált eszköz → megfelelő válasz
- Lejárt vagy érvénytelen JWT token → 401

### 3.2 POST /api/mint-ownership
- Happy path: fizetett rendelés + tokenAddress → sikeres minting
- Hiányzó `orderId` → 400
- Nem létező rendelés → 404
- Nem fizetett rendelés → 400
- Nincs tokenAddress az eszközön → 400
- Jogosultság: sem befektető, sem provider → 403
- Már mintelt rendelés → idempotens válasz (nem mintol újra)
- Gateway hiba → 500, de a MintRequest `failed` állapotba kerül

### 3.3 POST /api/chat
- Sikeres üzenetküldés → válasz + messageId-k + thread
- Hiányzó `text` → 400
- Érvénytelen token → 401

### 3.4 GET /api/chat
- Thread lista lekérdezés (`listThreads=1`) → helyes formátum
- Üzenet lista lekérdezés (`threadId=xyz`) → helyes formátum
- Hiányzó paraméterek → 400

### 3.5 POST /api/chat/anonymous
- Anonim profil létrehozás → httpOnly cookie beállítása
- Már létező anonim session → kezelés

### 3.6 POST /api/chat/claim
- Sikeres migráció: anonim thread-ek átkerülnek a bejelentkezett userhez
- Érvénytelen anon cookie → hiba
- Hiányzó bearer token → 401
- Nincs migrálható adat → üres válasz

### 3.7 POST /api/assets/draft
- Új eszköz draft létrehozása → 201
- Meglévő eszköz frissítése → 200
- Más user eszközének frissítése → 403
- Hiányzó kötelező mezők → 400

### 3.8 POST /api/assets/submit
- Sikeres beküldés tokenizációval → 200
- Már tokenizált eszköz beküldése (deploy kihagyás) → 200
- Jogosultság ellenőrzés → 403
- Érvénytelen token → 401

### 3.9 GET /api/auth/session
- Érvényes session → accessToken visszaadása
- Nincs session → megfelelő válasz

### 3.10 POST /api/account/delete
- Sikeres törlés → felhasználó + Cognito profil törlése
- Nem bejelentkezett → 401

### 3.11 POST /api/powens/create-payment
- Sikeres fizetés létrehozása → redirect URL
- Hiányzó beneficiary adatok → 400
- Jogosultság ellenőrzés → 403

### 3.12 POST /api/powens/payment-status
- Sikeres státusz lekérdezés és szinkronizálás
- Nem létező rendelés → 404

### 3.13 POST /api/powens/webhook
- Érvényes HMAC aláírás → fizetés szinkronizálás
- Érvénytelen aláírás → 401
- Lejárt timestamp (5 percnél régebbi) → 401
- Tömörített (gzip) body kezelése
- Ismeretlen payment ID → kezelés (ne crasheljen)

---

## 4. Infrastruktúra tesztek

### 4.1 InMemoryInvestmentRepository
- `createMintRequestIfMissing`: idempotencia – kétszeri hívás ugyanazzal az ID-val nem duplikál
- `findOrderByPaymentProviderId`: meglévő és nem létező rendelés

### 4.2 verifyAccessToken (JWT ellenőrzés)
- Érvényes token → helyes userId/email
- Lejárt token → hiba
- Rossz issuer → hiba
- Rossz `token_use` → hiba
- Érvénytelen aláírás → hiba

### 4.3 anonSession (anonim session kezelés)
- `buildAnonCookieValue` + `parseAnonCookieValue`: round-trip teszt
- Lejárt cookie (7 napon túl) → érvénytelen
- Manipulált HMAC → érvénytelen
- Üres / malformed cookie → érvénytelen

### 4.4 schemaMappers
- Minden mapper (UserProfile, Asset, Listing, Product, Order, BlogPost): helyes mező-leképezés
- Hiányzó opcionális mezők kezelése
- Státusz normalizáció (kisbetű/nagybetű)

### 4.5 publicUrls
- `toPublicStorageUrl`: helyes CDN URL generálás
- `toSafeFileName`: speciális karakterek, szóközök, ékezetes karakterek kezelése
- `assetImagePrefix` / `blogCoverPrefix`: helyes prefix generálás

### 4.6 DynamoDbRequestClaimGateway
- Sikeres claim (queued → submitting)
- Párhuzamos claim → `ConditionalCheckFailedException` kezelése
- Failed állapotú kérés újra-claimelése

---

## 5. Domain tesztek

### 5.1 DomainError
- Helyes név (`"DomainError"`)
- Öröklés az Error-ból, helyes stack trace

---

## 6. Prioritási sorrend

| Prioritás | Kategória | Indoklás |
|---|---|---|
| 🔴 Magas | Checkout szabályok (1.1) | Pénzügyi logika, gyakran változik |
| 🔴 Magas | InvestmentPlatformService negatív esetek (2.1) | A rendszer magja, sok éles boundary |
| 🔴 Magas | PowensPaymentSyncService (2.10) | Külső fizetési integráció, pénzmozgás |
| 🔴 Magas | Powens webhook route (3.13) | Biztonsági szempontból kritikus (HMAC) |
| 🔴 Magas | Mint-ownership route (3.2) | Blockchain tranzakciók, idempotencia |
| 🟡 Közepes | OwnershipMintingProcessor további esetek (2.4) | Állapotgép teljes lefedése |
| 🟡 Közepes | TokenizationService további esetek (2.3) | Idempotencia és versenyfeltételek |
| 🟡 Közepes | ContractDeploymentRules (1.2) | Deploy döntéshozatal helyessége |
| 🟡 Közepes | JWT verifyAccessToken (4.2) | Biztonsági kritikus |
| 🟡 Közepes | Anon session (4.3) | Biztonsági kritikus (cookie signing) |
| 🟡 Közepes | Chat route-ok (3.3, 3.4, 3.5, 3.6) | Anonim → autentikált migráció komplex |
| 🟢 Alacsony | Asset draft/submit route-ok (3.7, 3.8) | Kevésbé komplex logika |
| 🟢 Alacsony | BlogPostAdminService (2.9) | CRUD, kevés üzleti szabály |
| 🟢 Alacsony | SchemaMappers (4.4) | Egyszerű leképezések, ritka változás |
| 🟢 Alacsony | PublicUrls (4.5) | Segédfüggvények |
| 🟢 Alacsony | DomainError (5.1) | Triviális |

---

## 7. Tesztelési konvenciók (javaslat)

- **Fájlstruktúra**: `tests/unit/rules/*.test.ts`, `tests/unit/use-cases/*.test.ts`, `tests/integration/api/*.test.ts`, `tests/infrastructure/*.test.ts`
- **Elnevezés**: magyar vagy angol, de következetes – mivel a kódbázis angol, az angol tesztnevek ajánlottak
- **Fake-ek**: a meglévő `InMemoryInvestmentRepository` mintájára minden porthoz készüljön in-memory fake
- **Nincs külső függőség**: unit tesztek nem hívnak hálózatot, adatbázist, vagy fájlrendszert
- **Idempotencia tesztek**: minden állapotgépes műveletnél (minting, deployment) tesztelni kell a kétszeri hívást
- **Biztonsági tesztek**: HMAC, JWT, és cookie validáció tesztelése érvénytelen inputokkal

---

## 8. Összefoglaló számok

| Kategória | Becsült tesztesetek száma |
|---|---|
| Szabálymodulok (pure functions) | ~35 |
| Use case-ek / szolgáltatások | ~50 |
| API route integrációs tesztek | ~40 |
| Infrastruktúra tesztek | ~20 |
| Domain tesztek | ~2 |
| **Összesen** | **~147** |
