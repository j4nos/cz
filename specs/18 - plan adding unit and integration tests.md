# Test bovitasi terv (unit + integracios)

- Projekt: cityzeen-tdd
- Datum: 2026-03-16
- Cel: konkret, emberi nyelvu tesztjavaslatok, priorizalva

## 1) Kiindulo allapot roviden

Jelenleg van nehany jo alapteszt (pl. tokenization, chat, basic investment flow), de a teljes API felulethez es use-case keszlethez kepest a lefedettseg alacsony.

Meglevo tesztfajlok:
- tests/basicInvestmentFlow.test.ts
- tests/chatService.test.ts
- tests/ownershipMintingProcessorService.test.ts
- tests/tokenizationService.test.ts
- tests/tokenizeAssetRoute.test.ts

Ez jo kezdes, de a kovetkezo lepes a regresszio elleni vedettseg kiszelesitese.

## 2) Javasolt tesztstrategia

- Unit tesztek: uzleti szabalyok, validacio, allapot-atmenetek.
- Integracios tesztek: API route bemenet-kimenet, auth, hibakodok, fuggosegek kozti egyuttfutas mockolt kulso rendszerekkel.
- Prioritas: eloszor security es penzugyi folyamatok, utana UX es admin funkciok.

Arany javaslat:
- 70% unit
- 25% integracios route szint
- 5% teljes flow smoke

## 3) Konret UNIT tesztjavaslatok

### 3.1 Checkout szabalyok (checkoutRules.ts, checkoutService.ts)

1. Ha nincs listing vagy product, akkor a submit egyertelmu hibat adjon.
2. Ha a user nincs bejelentkezve es auth loading mar false, akkor loginra iranyito hibauzenet legyen.
3. Ha bank transfer van valasztva, de nincs beneficiary adat, akkor legyen tiltva a bank transfer.
4. Ha bank transfer van valasztva, de nincs access token, akkor legyen explicit hiba.
5. Ha bank transfer inditas sikeres, akkor redirect eredmeny jojjon vissza.
6. Ha bank transfer inditas sikertelen (nincs redirectUrl), akkor userbarat hiba jojjon vissza.
7. Ha card payment fut, akkor sikeres rendelest adjon vissza redirect nelkul.

### 3.2 Contract deployment szabalyok (contractDeploymentRules.ts, contractDeploymentService.ts)

1. Ha hianyzik assetId vagy userId, akkor pontos hiba legyen.
2. Ha hianyos asset alapadatok vannak (name/country/assetClass), akkor warning tone-u hiba jojjon.
3. Ha az asset mar tartalmaz tokenAddress-t, akkor ne induljon uj deploy.
4. Ha nincs tokenAddress es van access token, akkor deploy hivodjon es tokenAddress mentes tortenjen.
5. Ha nincs access token deploy szukseges esetben, akkor login required hiba legyen.
6. buildContractSymbol teszt: specialis karakteres nevbol stabil, max 6 karakteres symbol keszuljon.
7. buildAssetAfterContractDeployment teszt: status submitted legyen, es default mezok ne vesszenek el.

### 3.3 Minting szabalyok (ownershipMinting.ts, ownershipMintingService.ts, ownershipMintingProcessorService.ts)

1. Ha order nincs, akkor "Order not found." hiba jojjon.
2. Ha listing nincs, akkor "Listing not found." hiba jojjon.
3. Ha tokenAddress hianyzik, akkor ne engedje a mint kerest.
4. Ha orderben nincs wallet cim es inputban sincs, akkor pontos hiba legyen.
5. Ha queued/pending status jon vissza, akkor warning tone-u success toast jojjon.
6. Ha txHash erkezik, akkor success toast tartalmazza a tx hash-t.
7. Processor allapotgep teszt:
	- mar minted request eseten azonnal minted valasz,
	- submitting/submitted eseten pending valasz,
	- claim fail eseten pending/minted fallback az aktualis request alapjan,
	- gateway hiba eseten mintRequest failed, retryCount novelve, order mintError kitoltve.

### 3.4 Tokenization szabalyok (tokenizationService.ts)

1. Ha asset nem letezik, akkor DomainError "Asset not found.".
2. Ha asset mas usere, akkor DomainError "Forbidden.".
3. Ha asset mar tokenizalt, akkor deploy nelkul adja vissza a meglevo cimet.
4. Ha createContractDeploymentRequestIfMissing nem uj rekordot ad, de request tokenAddress mar van, akkor idempotens visszaadas tortenjen.
5. Ha claim fail es se request se asset oldalon nincs tokenAddress, akkor "already in progress" hiba.
6. Sikeres deploy utan:
	- updateAssetTokenization megtortenik,
	- updateContractDeploymentRequest submitted statusra all,
	- runId visszajon.
7. Gateway hiba utan deployment request failed status es errorMessage mentes tortenjen.

### 3.5 Investment platform szabalyok (investmentPlatformService.ts)

1. createProduct: min/max/supply validacio hibak kulon-kulon.
2. startOrder: listing nem open -> hiba.
3. startOrder: product mas listinghez tartozik -> hiba.
4. startOrder: quantity tul kicsi/tul nagy -> hiba.
5. startOrder: remainingSupply nem eleg -> hiba.
6. startOrder: investorType nem kompatibilis -> hiba.
7. completeOrderPayment:
	- csak pending order complete-elheto,
	- product remainingSupply csokken,
	- order status paid lesz.

### 3.6 Egyeb use-case-ek

checkout mellett ezekre is erdemes celzott unit csomagot adni:

- listingOpenRequirements.ts
1. closed listingnel idoszakon kivul hiba.
2. nincs foto -> hiba.
3. nincs product -> hiba.
4. open listingnel ne adjon hibat.

- pricingRules.ts
1. ures product nev hiba.
2. negativ unitPrice hiba.
3. ervenytelen min/max hiba.
4. supplyTotal kisebb mint maxPurchase hiba.
5. tier hozzaadas/torles immutable modon mukodik.

- assetUpdateAssembler.ts
1. uploadedPaths merge deduplikal.
2. normalize utan stabil storedPaths keletkezik.
3. buildUpdatedAssetBasics ne toroljon fontos mezo(ke)t.

- accountSettingsService.ts
1. login nelkul save provider/investor settings hibaval terjen vissza.
2. hianyos profile adatokkal investor save hibazzon.
3. deleteAccount token nelkul hibazzon, tokennel siker.

- blogPostAdminService.ts
1. validacio: title/excerpt/content/publishedAt/cover kotelezo.
2. save coverFile nelkul csak 1 mentes.
3. save coverFile-lal 2 lepcso: save -> upload -> save uj coverImage-gel.
4. upload hiba eseten hiba propagalasa.

- publicContent.ts
1. getPublicListingDetails null listingnel ures products.
2. getInvestorOrderEntry hianyzo ordernel minden null.
3. ervenyes ordernel listing+product parhuzamos feloldasa.

- powensPaymentSyncService.ts
1. map state: done -> paid, rejected/cancelled -> failed, pending csalad -> pending.
2. paid atmenet pending orderbol completeOrderPayment-et futtat.
3. ismeretlen state ne torje meg a jelenlegi order statuszt.

## 4) Konret INTEGRACIOS tesztjavaslatok (API route szint)

### 4.1 Legmagasabb prioritas (security + penzugy)

- app/api/powens/webhook/route.ts
1. Hianyzo signature header -> 401.
2. Lejart signature datum -> 401.
3. Ervenytelen HMAC -> 401.
4. Ures vagy hibas JSON payload -> 202 received:true.
5. Ervenyes payload, de order nem talalhato -> 202 received:true.
6. Ervenyes payload es ismert order -> 200 received:true.

- app/api/powens/create-payment/route.ts
1. Missing bearer token -> 401.
2. Idegen user orderere probal -> 403.
3. Nem bank-transfer order -> 400.
4. Hianyzo beneficiary adatok -> 400.
5. Powens token lekeres hiba -> 502.
6. Powens payment create hiba -> 502.
7. Sikeres flow -> redirectUrl + paymentId, order paymentProviderId frissul.

- app/api/powens/payment-status/route.ts
1. Missing bearer token -> 401.
2. Idegen user -> 403.
3. Hianyzo paymentProviderId -> 400.
4. Powens /payments/{id} hiba -> 502.
5. Sikeres sync -> paymentState + orderStatus visszajon.

- app/api/mint-ownership/route.ts
1. Missing bearer token -> 401.
2. Missing orderId -> 400.
3. Order not found -> 404.
4. Order nem paid -> 409.
5. Provider confirmation szukseges, de hianyzik -> 409.
6. User sem investor sem provider -> 403.
7. Wallet cim hianyzik es orderben sincs -> 400.
8. Wallet cim formatum hiba -> 400.
9. Leptezo queued/submitted request -> 202 pending.
10. Leptezo minted request -> 200 minted.
11. Uj request + processor pending -> 202.
12. Uj request + processor minted -> 200.

### 4.2 Magas prioritas (auth + adatintegritas)

- app/api/assets/draft/route.ts
1. Missing bearer token -> 401.
2. Invalid token -> 401.
3. Hianyos name/country/assetClass -> 400.
4. Meglevo asset mas tulajdonossal -> 403.
5. Uj asset mentes -> 200 asset objektum.
6. Meglevo asset frissites -> 200 es valtozasok visszajonnek.

- app/api/assets/submit/route.ts
1. Missing bearer token -> 401.
2. Hianyzo assetId vagy alap adatok -> 400.
3. Asset not found -> 404.
4. Forbidden tulajdonos -> 403.
5. Ha mar van tokenAddress, ne inditson tokenization-t.
6. Ha nincs tokenAddress, futtassa tokenization-t.
7. DomainError map korrekt statusra (403/404/409/500).

- app/api/tokenize-asset/route.ts
1. Missing bearer token -> 401.
2. Missing assetId -> 400.
3. Asset not found DomainError -> 404.
4. Forbidden DomainError -> 403.
5. In progress DomainError -> 409.
6. Sikeres tokenization -> address, standard, supportsErc721, runId.

- app/api/account/delete/route.ts
1. Missing user pool config -> 500.
2. Missing bearer token -> 401.
3. Invalid token -> 401.
4. Sikeres torles userId alapjan -> 200.
5. userId torles hibanal email fallback sikeres -> 200.
6. mindket torles hiba -> 500.

### 4.3 Kozepes prioritas (chat es session)

- app/api/chat/anonymous/route.ts
1. Sikeres POST letrehoz anon usert es beallit httponly cookie-t.
2. repository create hiba -> 500.

- app/api/chat/claim/route.ts
1. Missing toUserId -> 400.
2. Missing bearer token -> 401.
3. Token userId != toUserId -> 403.
4. Missing anon cookie -> 401.
5. Invalid anon cookie -> 401.
6. fromUserId == toUserId eseten migrated:false, cookie torlodik.
7. Sikeres migrate: threadek/uzenetek atmozgatva, profile torolve, cookie torolve.
8. Batch update reszleges hiba eseten 500.

- app/api/chat/route.ts
1. POST hianyos input -> 400.
2. POST sikeres -> answer + messageIds + thread.
3. GET listThreads=1 hianyos userId -> 400.
4. GET listThreads=1 sikeres -> threads tomb.
5. GET threadId alapu sikeres -> messages tomb.

- app/api/auth/session/route.ts
1. fetchAuthSession sikeres -> accessToken visszajon.
2. fetchAuthSession hiba -> 401, accessToken:null.

## 5) Tesztfajl szerkezet javaslat

Unit:
- tests/unit/use-cases/*.test.ts
- tests/unit/rules/*.test.ts

Integracios:
- tests/integration/api/**/*.test.ts

Shared test helper:
- tests/helpers/factories.ts
- tests/helpers/http.ts
- tests/helpers/mocks/aws.ts

Mintas file-nevek:
- tests/unit/use-cases/checkoutService.test.ts
- tests/unit/use-cases/contractDeploymentService.test.ts
- tests/unit/rules/contractDeploymentRules.test.ts
- tests/integration/api/powens/webhook.route.test.ts
- tests/integration/api/assets/submit.route.test.ts

## 6) 3 lepcsos bevezetesi terv

### Fazis 1 (gyors nyereseg, 2-3 nap)

1. Powens webhook/create-payment/payment-status route tesztek.
2. mint-ownership route kritikus hibaagak.
3. checkoutRules + contractDeploymentRules unit csomag.

### Fazis 2 (stabil uzleti mag, 3-5 nap)

1. tokenizationService edge case-ek teljesitese.
2. investmentPlatformService negativ agak.
3. ownershipMintingProcessorService allapotgep teljes kiterjesztese.

### Fazis 3 (teljes lefedettseg noveles, 4-7 nap)

1. account settings + blog admin + public content unit tesztek.
2. chat/anonymous/chat/claim/auth-session route integracios tesztek.
3. coverage threshold bevezetese (pl. lines 70%, branches 60%; kritikus modulokra 80%+).

## 7) Definition of done (ajanlott)

1. Minden kritikus route-ra van legalabb: auth hiba, validacio hiba, success teszt.
2. Minden fo use-case-re van legalabb 1 success + 2 hibaagi unit teszt.
3. Nincs flaky teszt ket egymas utani futasban.
4. Uj tesztek gyorsan futnak lokalban (cel: < 60s teljes csomag).
5. Pull request csak zold test + lint + build allapottal merge-olhato.

## 8) Elso konkret backlog (azonnal felveheto taskok)

1. Keszitsd el a tests/integration/api/powens/webhook.route.test.ts fajlt 6 esettel.
2. Keszitsd el a tests/integration/api/mint-ownership.route.test.ts fajlt 10+ esettel.
3. Keszitsd el a tests/unit/use-cases/checkoutService.test.ts fajlt 7 esettel.
4. Keszitsd el a tests/unit/use-cases/contractDeploymentService.test.ts fajlt 6 esettel.
5. Keszitsd el a tests/unit/use-cases/tokenizationService.edge.test.ts fajlt 6 esettel.

Ha szeretned, a kovetkezo korben a fenti backlog 1. pontjat (powens webhook integracios tesztek) rogton implementalom is.
