# Integration teszt otletek

- Projekt: cityzeen-tdd
- Datum: 2026-03-16
- Cel: konkret, priorizalt integration test backlog az API route-okhoz

## 1) Fokusz

Az integration tesztek itt elsosorban route szintu teszteket jelentenek:

- request input validacio,
- auth es authorization ellenorzes,
- status code es response body ellenorzes,
- route szintu orchestration a service-ek, repository-k es gateway-ek felett,
- kulso rendszerekkel valo kommunikacio kontrollalt mockokkal.

Nem cel ezekben a tesztekben:

- AWS SDK vagy Amplify belso mukodesenek tesztelese,
- Ethers vagy Powens kliens valos runtime viselkedesenek ellenorzese,
- teljes end-to-end browser flow lefedese.

## 2) Prioritas sorrend

1. Powens route-ok
2. mint-ownership route
3. assets draft es submit route-ok
4. tokenize-asset route
5. account delete route
6. chat route-ok
7. auth session route

## 3) Legmagasabb prioritas: security + penzugy

### 3.1 powens webhook

Fajl: app/api/powens/webhook/route.ts

Fo esetek:

1. Hianyzo signature header eseten 401 jojjon vissza.
2. Lejart signature datum eseten 401 jojjon vissza.
3. Ervenytelen HMAC eseten 401 jojjon vissza.
4. Ures vagy hibas JSON payload eseten 202 es `{ received: true }` jojjon.
5. Ervenyes payload, de nem letezo order eseten 202 es `{ received: true }` jojjon.
6. Ervenyes payload es ismert order eseten 200 es `{ received: true }` jojjon.

Megjegyzes:

- Itt kulonosen fontos a signature validation es a webhook idempotens kezelesenek ellenorzese.

### 3.2 powens create-payment

Fajl: app/api/powens/create-payment/route.ts

Fo esetek:

1. Missing bearer token -> 401.
2. Ha a user nem a sajat orderere probal paymentet inditani -> 403.
3. Ha az order nem `bank-transfer` payment provideres -> 400.
4. Hianyzo beneficiary adatokkal -> 400.
5. Powens token lekeres hiba -> 502.
6. Powens payment create hiba -> 502.
7. Sikeres flow -> 200, `redirectUrl` es `paymentId` visszajon, az order `paymentProviderId` frissul.

### 3.3 powens payment-status

Fajl: app/api/powens/payment-status/route.ts

Fo esetek:

1. Missing bearer token -> 401.
2. Idegen order lekerdezese -> 403.
3. Hianyzo `paymentProviderId` -> 400.
4. Powens `/payments/{id}` hiba -> 502.
5. Sikeres sync -> 200, `paymentState` es `orderStatus` visszajon.

### 3.4 mint-ownership

Fajl: app/api/mint-ownership/route.ts

Fo esetek:

1. Missing bearer token -> 401.
2. Missing `orderId` -> 400.
3. Order not found -> 404.
4. Order nem `paid` -> 409.
5. Ha provider confirmation szukseges, de nincs meg -> 409.
6. Ha a user sem investor, sem provider az adott orderen -> 403.
7. Wallet cim hianyzik es az order sem tartalmazza -> 400.
8. Wallet cim formatum hiba -> 400.
9. Letezo `queued` vagy `submitted` request -> 202 pending.
10. Letezo `minted` request -> 200 minted.
11. Uj request es processor pending valasz -> 202.
12. Uj request es processor minted valasz -> 200.

Megjegyzes:

- Ez a route kulonosen kritikus, mert auth, ownership es allapotgep logikat egyszerre mozgat.

## 4) Magas prioritas: auth + adatintegritas

### 4.1 assets draft

Fajl: app/api/assets/draft/route.ts

Fo esetek:

1. Missing bearer token -> 401.
2. Invalid token -> 401.
3. Hianyos `name`, `country` vagy `assetClass` -> 400.
4. Meglevo asset mas tulajdonossal -> 403.
5. Uj asset mentes -> 200, asset objektum visszajon.
6. Meglevo asset frissites -> 200, valtozasok visszajonnek.

### 4.2 assets submit

Fajl: app/api/assets/submit/route.ts

Fo esetek:

1. Missing bearer token -> 401.
2. Hianyzo `assetId` vagy alap asset adatok -> 400.
3. Asset not found -> 404.
4. Forbidden tulajdonos -> 403.
5. Ha mar van `tokenAddress`, ne inditson uj tokenization-t.
6. Ha nincs `tokenAddress`, futtassa a tokenization folyamatot.
7. DomainError status mapping helyes legyen: 403, 404, 409 vagy 500.

### 4.3 tokenize-asset

Fajl: app/api/tokenize-asset/route.ts

Fo esetek:

1. Missing bearer token -> 401.
2. Missing `assetId` -> 400.
3. `Asset not found.` DomainError -> 404.
4. `Forbidden.` DomainError -> 403.
5. `already in progress` jellegu DomainError -> 409.
6. Sikeres tokenization -> 200, `address`, `standard`, `supportsErc721`, `runId` visszajon.

Megjegyzes:

- Ennél a route-nál a repository es tokenization gateway mockolast egyutt kell kezelni.

### 4.4 account delete

Fajl: app/api/account/delete/route.ts

Fo esetek:

1. Missing user pool config -> 500.
2. Missing bearer token -> 401.
3. Invalid token -> 401.
4. Sikeres torles userId alapjan -> 200.
5. Ha a userId alapju torles hibazik, de az email fallback sikeres -> 200.
6. Ha mindket torlesi probalkozas hibazik -> 500.

## 5) Kozepes prioritas: chat + session

### 5.1 chat anonymous

Fajl: app/api/chat/anonymous/route.ts

Fo esetek:

1. Sikeres POST letrehoz anonim usert es `httpOnly` cookie-t allit be.
2. Repository vagy profile letrehozasi hiba -> 500.

### 5.2 chat claim

Fajl: app/api/chat/claim/route.ts

Fo esetek:

1. Missing `toUserId` -> 400.
2. Missing bearer token -> 401.
3. Token userId nem egyezik `toUserId`-val -> 403.
4. Missing anonim cookie -> 401.
5. Invalid anonim cookie -> 401.
6. Ha `fromUserId == toUserId`, akkor `migrated: false` menjen vissza es a cookie torlodjon.
7. Sikeres migrate eseten a threadek/uzenetek atkerulnek, a regi profile torlodik, a cookie torlodik.
8. Batch update reszleges hiba -> 500.

### 5.3 chat route

Fajl: app/api/chat/route.ts

Fo esetek:

1. POST hianyos input -> 400.
2. POST sikeres -> 200, `answer`, `messageIds` es `thread` visszajon.
3. GET `listThreads=1` hianyzo `userId` mellett -> 400.
4. GET `listThreads=1` sikeresen -> 200, `threads` tomb.
5. GET `threadId` lekerdezes sikeresen -> 200, `messages` tomb.

### 5.4 auth session

Fajl: app/api/auth/session/route.ts

Fo esetek:

1. `fetchAuthSession` sikeres -> 200, `accessToken` visszajon.
2. `fetchAuthSession` hiba -> 401, `accessToken: null`.

## 6) Javasolt tesztfajl szerkezet

Integracios route tesztek:

- tests/integration/api/powens/webhook.route.test.ts
- tests/integration/api/powens/create-payment.route.test.ts
- tests/integration/api/powens/payment-status.route.test.ts
- tests/integration/api/mint-ownership.route.test.ts
- tests/integration/api/assets/draft.route.test.ts
- tests/integration/api/assets/submit.route.test.ts
- tests/integration/api/tokenize-asset.route.test.ts
- tests/integration/api/account/delete.route.test.ts
- tests/integration/api/chat/anonymous.route.test.ts
- tests/integration/api/chat/claim.route.test.ts
- tests/integration/api/chat/route.test.ts
- tests/integration/api/auth/session.route.test.ts

Shared helper javaslat:

- tests/helpers/http.ts
- tests/helpers/api-auth.ts
- tests/helpers/mocks/aws.ts
- tests/helpers/mocks/powens.ts

## 7) Mockolasi iranyelvek

1. Route integration tesztekben a request parsing es response shaping legyen valos, a kulso fuggosegek legyenek mockok.
2. AWS, Amplify, Cognito, Powens es Ethers hivások ne menjenek ki valos halozatra.
3. Auth teszteknel kulon legyen eset missing token, invalid token es valid token path-ra.
4. Penzugyi route-oknal mindig legyen success, validation error, auth error es upstream dependency error eset is.
5. Webhook route-oknal legyen kulon teszt az idempotens vagy mar feldolgozott allapotokra is.

## 8) Elso 5 backlog tetel

1. powens webhook route tesztek.
2. powens create-payment es payment-status route tesztek.
3. mint-ownership route tesztek.
4. assets submit es tokenize-asset route tesztek.
5. account delete es chat claim route tesztek.

## 9) Definition of done

1. Minden kritikus route-ra van legalabb auth hiba, validacio hiba es success teszt.
2. Minden Powens route-ra van legalabb egy upstream error teszt.
3. A route tesztek nem fuggenek valos AWS vagy Powens kapcsolattol.
4. A teljes integration csomag stabilan fut ket egymas utani alkalommal is.
5. A status code es response body ellenorzes minden route-nal explicit.
