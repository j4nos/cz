# Unit teszt otletek

- Projekt: cityzeen-tdd
- Datum: 2026-03-16
- Cel: konkret, roviden priorizalt unit teszt backlog a meglevo use-case-ekhez

## 1) Fokusz

Elsokent azokra a modulokra erdemes unit teszteket irni, amelyek:

- penzugyi vagy ownership allapotot valtoztatnak,
- tobb validacios szabalyt tartalmaznak,
- kulso gateway vagy repository hivast orkestralnak,
- idempotens vagy allapotgepes viselkedest varnak el.

Prioritas sorrend:

1. tokenizationService
2. ownershipMintingProcessorService
3. ownershipMintingService / ownershipMinting
4. investmentPlatformService
5. checkoutRules / checkoutService
6. contractDeploymentRules / contractDeploymentService
7. pricingRules
8. listingOpenRequirements
9. accountSettingsService
10. blogPostAdminService
11. publicContent
12. powensPaymentSyncService

## 2) Fo unit teszt csomagok

### 2.1 tokenizationService

Fajl: src/application/use-cases/tokenizationService.ts

Fo esetek:

1. Ha az asset nem letezik, DomainError "Asset not found." terjen vissza.
2. Ha az asset nem a bejelentkezett userhez tartozik, DomainError "Forbidden." terjen vissza.
3. Ha az asset mar tokenAddress-szel rendelkezik, a service a meglevo cimmel terjen vissza uj deploy nelkul.
4. Ha createContractDeploymentRequestIfMissing meglevo requestet ad vissza es azon mar van tokenAddress, idempotens valasz jojjon vissza.
5. Ha a gateway claim hibaval zarul es sem a requesten, sem az asseten nincs tokenAddress, "already in progress" vagy ennek megfelelo konfliktus-hiba jojjon.
6. Sikeres deploy utan updateAssetTokenization hivodjon a vart token adatokkal.
7. Sikeres deploy utan updateContractDeploymentRequest submitted statusra alljon es a runId mentesre keruljon.
8. Gateway hiba eseten a deployment request failed statusra alljon es az errorMessage el legyen mentve.

Ertek:

- Ez a legfontosabb unit csomag, mert orchestracios es idempotencia logika is van benne.

### 2.2 ownershipMintingProcessorService

Fajl: src/application/use-cases/ownershipMintingProcessorService.ts

Fo esetek:

1. Ha mar minted request erkezik, a service azonnal minted valasszal terjen vissza uj feldolgozas nelkul.
2. Ha a request status submitting vagy submitted, pending valasz jojjon vissza.
3. Ha a claim eredmenye queued, a request pending/submitted iranyba alljon.
4. Ha a claim eredmenye minted, a request minted statusra alljon es a txHash is mentesre keruljon.
5. Ha a gateway hibat dob, retryCount novelodjon.
6. Gateway hiba eseten a request failed statusra alljon es az order mintError mezot is frissitse.
7. Ha claim utan a repository mar minted allapotot ad vissza, a valasz legyen idempotensen minted.
8. Ha claim utan csak reszben frissitheto az order vagy request, a hiba ne maradjon csendben elnyelve.

Ertek:

- Ez a masodik legkritikusabb terulet az ownership tokenek allapotgepe miatt.

### 2.3 ownershipMintingService es ownershipMinting

Fajlok:

- src/application/use-cases/ownershipMintingService.ts
- src/application/use-cases/ownershipMinting.ts

Fo esetek:

1. Ha az order nem letezik, pontos "Order not found." hiba jojjon.
2. Ha a listing nem letezik, pontos "Listing not found." hiba jojjon.
3. Ha a listinghez vagy requesthez nem tartozik tokenAddress, a minting ne induljon el.
4. Ha sem input wallet cim, sem order wallet cim nincs, validacios hiba jojjon.
5. Ha a feldolgozo queued vagy pending eredmenyt ad, warning jellegu sikeruzenet keletkezzen.
6. Ha txHash erkezik, a sikeres valasz tartalmazza a tranzakcio azonositojat.
7. Ha mar letezik aktiv request, ne hozzon letre duplikalt uj requestet.

### 2.4 investmentPlatformService

Fajl: src/application/use-cases/investmentPlatformService.ts

Fo esetek:

1. createProduct: minPurchase kisebb mint 1 eseten validacios hiba legyen.
2. createProduct: maxPurchase kisebb mint minPurchase eseten validacios hiba legyen.
3. createProduct: supplyTotal kisebb mint maxPurchase eseten validacios hiba legyen.
4. startOrder: ha a listing nem open, hiba jojjon.
5. startOrder: ha a product nem a listinghez tartozik, hiba jojjon.
6. startOrder: quantity tul kicsi vagy tul nagy, hiba jojjon.
7. startOrder: ha nincs eleg remainingSupply, hiba jojjon.
8. startOrder: investorType inkompatibilis eseten hiba jojjon.
9. completeOrderPayment: csak pending order complete-elheto.
10. completeOrderPayment: siker eseten a product remainingSupply csokkenjen.
11. completeOrderPayment: siker eseten az order status paid legyen.

### 2.5 checkoutRules es checkoutService

Fajlok:

- src/application/use-cases/checkoutRules.ts
- src/application/use-cases/checkoutService.ts

Fo esetek:

1. Ha nincs listing vagy product, a submit egyertelmu hibat adjon.
2. Ha a user nincs bejelentkezve es auth loading mar false, loginra utalo hiba jojjon.
3. Ha bank transfer van valasztva, de nincs beneficiary adat, legyen tiltva vagy hibazzon.
4. Ha bank transfer van valasztva, de nincs access token, explicit auth hiba jojjon.
5. Ha bank transfer inditas sikeres, redirectUrl keruljon vissza a valaszba.
6. Ha bank transfer inditas sikertelen es nincs redirectUrl, userbarat hiba jojjon.
7. Ha card payment fut, sikeres rendelest adjon vissza redirect nelkul.

### 2.6 contractDeploymentRules es contractDeploymentService

Fajlok:

- src/application/use-cases/contractDeploymentRules.ts
- src/application/use-cases/contractDeploymentService.ts

Fo esetek:

1. Ha hianyzik assetId vagy userId, pontos validacios hiba legyen.
2. Ha az asset alapadatai hianyosak, a service ne inditson deploy-t.
3. Ha az asset mar tartalmaz tokenAddress-t, ne induljon uj deploy.
4. Ha nincs tokenAddress es van access token, a gateway deploy hivasa megtortenjen.
5. Ha deploy szukseges, de nincs access token, login required hiba jojjon.
6. buildContractSymbol specialis karakteres nevbol is stabil, rovid symbolt allitson elo.
7. buildAssetAfterContractDeployment megorizze a korabbi asset mezoket es allitsa submitted statusra.

### 2.7 pricingRules

Fajl: src/application/use-cases/pricingRules.ts

Fo esetek:

1. Ures product nev eseten validacios hiba legyen.
2. Negativ unitPrice eseten validacios hiba legyen.
3. Ervenytelen min/max kombinacio eseten hiba legyen.
4. supplyTotal kisebb mint maxPurchase eseten hiba legyen.
5. Tier hozzaadas immutable modon tortenjen.
6. Tier torles immutable modon tortenjen.
7. Modositas utan a nem erintett pricing mezok valtozatlanok maradjanak.

### 2.8 listingOpenRequirements

Fajl: src/application/use-cases/listingOpenRequirements.ts

Fo esetek:

1. Closed listing eseten nyitasi kovetelmeny hiba jojjon.
2. Ha nincs kep vagy media, a listing ne legyen megnyithato.
3. Ha nincs product, a listing ne legyen megnyithato.
4. Ha minden feltetel teljesul, ne adjon hibat.

### 2.9 accountSettingsService

Fajl: src/application/use-cases/accountSettingsService.ts

Fo esetek:

1. Login nelkul provider beallitas mentese hibazzon.
2. Login nelkul investor beallitas mentese hibazzon.
3. Hianyos investor profile adatokkal save hibazzon.
4. deleteAccount token nelkul hibazzon.
5. deleteAccount tokennel sikeresen tovabblepjen a repository vagy auth layer fele.

### 2.10 blogPostAdminService

Fajl: src/application/use-cases/blogPostAdminService.ts

Fo esetek:

1. title kotelezo.
2. excerpt kotelezo.
3. content kotelezo.
4. publishedAt kotelezo.
5. cover kotelezo az elvart workflow szerint.
6. coverFile nelkul csak egyszer mentsen.
7. coverFile-lal save -> upload -> save sorrendben hivja a portokat.
8. Upload hiba eseten a hiba propagalodjon.

### 2.11 publicContent

Fajl: src/application/use-cases/publicContent.ts

Fo esetek:

1. getPublicListingDetails null listingnel ures products tombbel terjen vissza.
2. getInvestorOrderEntry hianyzo ordernel null ertekekkel vagy ures eredmennyel terjen vissza.
3. Ervenyes ordernel a listing es product osszerendeles helyes legyen.
4. Parhuzamosan feloldott adatoknal a service stabil alakban adja vissza az eredmenyt.

### 2.12 powensPaymentSyncService

Fajl: src/application/use-cases/powensPaymentSyncService.ts

Fo esetek:

1. A Powens allapot done -> paid mappinget adjon.
2. rejected vagy cancelled -> failed mappinget adjon.
3. pending jellegu allapotok -> pending mappinget adjanak.
4. Ha a sync paid allapotot kap pending orderre, completeOrderPayment hivodjon.
5. Ismeretlen state ne torje meg a meglevo order statuszt.

## 3) Javasolt tesztfajlok

Javasolt uj tesztfajlok:

- tests/unit/use-cases/tokenizationService.test.ts
- tests/unit/use-cases/ownershipMintingProcessorService.test.ts
- tests/unit/use-cases/ownershipMintingService.test.ts
- tests/unit/use-cases/investmentPlatformService.test.ts
- tests/unit/use-cases/checkoutService.test.ts
- tests/unit/use-cases/contractDeploymentService.test.ts
- tests/unit/rules/pricingRules.test.ts
- tests/unit/rules/listingOpenRequirements.test.ts
- tests/unit/use-cases/accountSettingsService.test.ts
- tests/unit/use-cases/blogPostAdminService.test.ts
- tests/unit/use-cases/publicContent.test.ts
- tests/unit/use-cases/powensPaymentSyncService.test.ts

Megjegyzes:

- A jelenlegi repo gyokerben levo tesztek fokozatosan atmozgathatok a tests/unit ala, de ez nem feltetele az uj csomagok elkezdesenek.

## 4) Mockolasi iranyelvek

1. A use-case unit tesztekben repository, gateway es auth fuggosegek mindig mockok legyenek.
2. Kulso szolgaltatasoknal ne AWS vagy Ethers runtime viselkedest teszteljunk, hanem az alkalmazasi donteseket.
3. Idempotens folyamatoknal mindig legyen kulon teszt az "elso futas" es a "mar letezo request" esetre.
4. Allapotgepes use-case-eknel minden kulcs statuszra legyen legalabb egy teszt: pending, submitted, failed, minted vagy paid.

## 5) Elso 5 backlog tetel

1. tokenizationService unit tesztek teljes edge-case csomagja.
2. ownershipMintingProcessorService allapotgep tesztjei.
3. investmentPlatformService negativ es success agak.
4. checkoutService es contractDeploymentService validacios csomag.
5. pricingRules es listingOpenRequirements gyors szabalytesztek.
