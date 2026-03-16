# Szoftverminosegi audit eredmeny

- Projekt: cityzeen-tdd
- Audit datum: 2026-03-16
- Auditor: GitHub Copilot (GPT-5.3-Codex)

## Osszegzes

A projekt alapvetoen jo iranyban van: a build sikeres, a tesztcsomag jelenleg zold, es a retegzett (application/domain/infrastructure) szerkezet egyertelmu. Ugyanakkor tobb magas prioritasu kockazatot talaltam a termelesi biztonsagban es a regresszios vedettsegben.

**Becsult aktualis minosegi erettseg: 6.7/10**

Fo okok:
- eros architekturalis alapok es strict TypeScript beallitas,
- de kritikus dependency sebezhetosegek,
- alacsony tesztelesi szelesseg az API felulethez kepest,
- nehany nagy, nehezen karbantarthato hotspot fajl.

## Audit modszertan

Vegrehajtott ellenorzesek:
- `npm run test`
- `npm run lint`
- `npm run build`
- `npm audit --omit=dev --audit-level=high`
- statikus mintavetelezes (API route-ok, tesztallomanyok, hotspot fajlok)

## Tenyek es meroszamok

- Build status: **sikeres** (`BUILD_EXIT:0`)
- Lint status: **sikeres, de 7 figyelmeztetes** (`@next/next/no-img-element`)
- VS Code Problems: **nincs aktiv hiba**
- OSS sebezhetosegek (`npm audit`): **21 db**
	- 9 critical
	- 5 moderate
	- 7 low
- Fobb kodbazis meretek:
	- ~167 db TS/TSX/JS/JSX forrasfajl (`src`, `app`, `components`, `tests`, `amplify`)
	- 13 db API route fajl (`app/api`)
	- 5 db tesztfajl, osszesen 9 teszteset

## Megallapitasok (sulyossag szerint)

### 1) Kritikus: dependency sebezhetosegek termelesi csomagokban

Megallapitas:
- A `npm audit` kritikus sebezhetosegeket jelez, tobbek kozott `next` es AWS SDK tranzitiv csomagok kapcsan (`fast-xml-parser`, `@smithy/*`).

Kockazat:
- DoS, authorization bypass, middleware/SSRF jellegu tamadasi felulet novelese.

Javaslat:
- Azonnali verziofrissites es ujraaudit:
	- `next` frissites legalabb auditalt patch szintre
	- `aws-amplify` / `@aws-sdk/*` frissites konziszten csoportban
	- `npm audit fix` kontrollalt futtatasa branch-ben, majd regresszios teszt

### 2) Magas: tesztelesi lefedettseg valoszinuleg alacsony az API felulethez kepest

Megallapitas:
- 13 API route mellett 5 tesztfajl / 9 teszteset talalhato.
- Nincs jel arra, hogy kulcs endpointokra (pl. webhook, anonymous chat session, auth session route) lenne dedikalt regresszios teszt.

Kockazat:
- Gyors feature bovites mellett no a regresszio valoszinusege.
- Biztonsagi szabalyrendszerek konnyebben serulhetnek eszrevettlenul.

Javaslat:
- Min. smoke + hibaagi route tesztek minden API endpointra.
- Celzottan: `powens/webhook`, `chat/anonymous`, `auth/session`, `chat`.
- Vitest coverage riport bekapcsolasa + minimum threshold (pl. lines 70%, branches 60%, kritikus use-case-ekre 85%+).

### 3) Kozepes: karbantarthatosagi hotspotok (nagy, tobb felelossegu fajlok)

Megallapitas:
- Nagy fajlok azonosithatok, pl. `src/infrastructure/repositories/amplifyInvestmentRepository.ts` (562 sor).
- Ezekben egy osztaly sok aggregate CRUD es mapper orchestration felelosseget visz.

Kockazat:
- Nehezebb valtoztatas, magasabb regresszio-risk, hosszu code review ciklusok.

Javaslat:
- Modularizalas aggregate alapon (Asset, Listing, Product, Order repository adapterek).
- Kisebb adapter osztalyok + kozos util a map/normalize logikahoz.

### 4) Kozepes: auth policy kovetkezetessegben van szurke zona

Megallapitas:
- Vannak route-ok token validacio nelkul (`auth/session`, `chat/anonymous`, `chat`, `powens/webhook`).
- Ezek kozul van legitim (pl. webhook sajat signature alairassal), de policy dokumentacio es route-szintu teszt nelkul konnyen felreertheto.

Kockazat:
- Jovo beli modositasnal akaratlan jogosultsagi gyengules.

Javaslat:
- Endpoint security matrix a README/spec-ben:
	- melyik route milyen hitelesitest var (Bearer, signature, anon cookie)
	- miert elfogadott a publikus endpoint
- route szintu security regression tesztek.

### 5) Alacsony-Kozepes: frontend teljesitmeny figyelmeztetesek

Megallapitas:
- 7 lint figyelmeztetes `<img>` hasznalat miatt (`@next/next/no-img-element`).

Kockazat:
- Rosszabb LCP/bandwidth hatekonysag, skala eseten koltsegnovekedes.

Javaslat:
- Atallas `next/image` komponensre ahol nem utkozik az uzleti/cms kovetelmenyekkel.

## Pozitivumok

- Build stabilan lefut, tipushibak nelkul.
- `strict: true` TypeScript beallitas eros alap.
- Tiszta retegzes lathato (`application/domain/infrastructure`).
- Van mar uzleti folyamat teszt (basic investment flow) es API/use-case celtesztek.

## Priorizalt akcioterv

### 0-7 nap (azonnali)

1. Dependency security frissitesek (Next, Amplify/AWS SDK) kulon branch-ben.
2. `npm audit` ujrafuttatas, kritikusak 0-ra csokkentese cel.
3. Security-sensitive route smoke tesztek hozzaadasa (`powens/webhook`, `chat/anonymous`, `auth/session`).

### 8-30 nap

1. Vitest coverage riport bekapcsolasa + threshold policy.
2. API route regression csomag bovitese (minimum happy path + invalid auth + invalid payload).
3. `<img>` -> `next/image` atallas top landing/hero/nezetekben.

### 31-60 nap

1. `amplifyInvestmentRepository` bontasa kisebb adapterekre.
2. Endpoint security matrix formalizalasa es CI gate-be emelese (pl. lint/test/check script).
3. Minosegi KPI dashboard: tesztfutas ido, flaky rate, coverage trend.

## Kockazati profil (rovid)

- Biztonsag: **Magas** (jelenlegi audit sebezhetosegek miatt)
- Megbizhatosag: **Kozepes** (tesztek zold, de coverage valoszinuleg sekely)
- Karbantarthatosag: **Kozepes** (hotspot fajlok)
- Teljesitmeny: **Kozepes/Javithato** (`<img>` lint warningok)

## Vegso ertekeles

A projekt jo alapokra epul, de termelesi szinthez a security update-ek es a route-szintu regresszios vedettseg erositeset javaslom elso korben. Ezek rendezesevel a minosegi erettseg rovid tavon realisan 8/10 kozelebe emelheto.
