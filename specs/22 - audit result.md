# Kódminőségi audit eredmény, javítás utáni állapot

- Projekt: cityzeen-tdd
- Dátum: 2026-03-17
- Auditor: GitHub Copilot (GPT-5.4)

## Összegzés

Az előző auditban azonosított fő kódminőségi problémák döntő többsége javítva lett. A jelenlegi állapot alapján a kritikusabb szerkezeti és minőségi kockázatok, amelyek közvetlenül a hibamodellezést, a függőségkezelést, a teszttípusokat és a lint állapotot érintették, lezártnak tekinthetők.

## Javított tételek

1. A string-alapú `DomainError.message` státuszkód-mappelés megszűnt. A hibamodellezés most strukturált, kód- és HTTP státusz-alapú, lásd [errors.ts](/Users/kukodajanos/Workspace/cityzeen-tdd/src/domain/value-objects/errors.ts#L1) és [domainErrorResponse.ts](/Users/kukodajanos/Workspace/cityzeen-tdd/src/infrastructure/http/domainErrorResponse.ts#L1). A releváns route-ok már ezt használják, például [tokenize-asset route](/Users/kukodajanos/Workspace/cityzeen-tdd/app/api/tokenize-asset/route.ts#L1) és [assets submit route](/Users/kukodajanos/Workspace/cityzeen-tdd/app/api/assets/submit/route.ts#L1).

2. A közvetlen `new AmplifyInvestmentRepository()` építés a felsőbb rétegekben kiszervezésre került egy központi composition rétegbe, lásd [defaults.ts](/Users/kukodajanos/Workspace/cityzeen-tdd/src/infrastructure/composition/defaults.ts#L1). A route-ok és controller factory-k most ezen keresztül épülnek fel, például [createAssetController.ts](/Users/kukodajanos/Workspace/cityzeen-tdd/src/infrastructure/controllers/createAssetController.ts#L1), [createOrderController.ts](/Users/kukodajanos/Workspace/cityzeen-tdd/src/infrastructure/controllers/createOrderController.ts#L1), [powens webhook route](/Users/kukodajanos/Workspace/cityzeen-tdd/app/api/powens/webhook/route.ts#L1).

3. Az `AmplifyInvestmentRepository` szerkezete karcsúsodott: a korábbi monolit adapter delegáló façade lett, és a felelősségek külön repository adapterekbe kerültek. Lásd [amplifyInvestmentRepository.ts](/Users/kukodajanos/Workspace/cityzeen-tdd/src/infrastructure/repositories/amplifyInvestmentRepository.ts#L1), valamint [amplifyAssetRepository.ts](/Users/kukodajanos/Workspace/cityzeen-tdd/src/infrastructure/repositories/amplifyAssetRepository.ts#L1), [amplifyCatalogRepository.ts](/Users/kukodajanos/Workspace/cityzeen-tdd/src/infrastructure/repositories/amplifyCatalogRepository.ts#L1), [amplifyOrderRepository.ts](/Users/kukodajanos/Workspace/cityzeen-tdd/src/infrastructure/repositories/amplifyOrderRepository.ts#L1), [amplifyUserProfileRepository.ts](/Users/kukodajanos/Workspace/cityzeen-tdd/src/infrastructure/repositories/amplifyUserProfileRepository.ts#L1), [amplifyBlogRepository.ts](/Users/kukodajanos/Workspace/cityzeen-tdd/src/infrastructure/repositories/amplifyBlogRepository.ts#L1).

4. A tesztoldali `as unknown as` kerülőutak kivezetésre kerültek az érintett egységtesztekből, és a fake repository-k immár valódi, típusos szerződés alapján működnek. Példák: [investmentPlatformService.test.ts](/Users/kukodajanos/Workspace/cityzeen-tdd/tests/unit/use-cases/investmentPlatformService.test.ts#L1), [powensPaymentSyncService.test.ts](/Users/kukodajanos/Workspace/cityzeen-tdd/tests/unit/use-cases/powensPaymentSyncService.test.ts#L1), [ownershipMintingProcessorService.test.ts](/Users/kukodajanos/Workspace/cityzeen-tdd/tests/unit/use-cases/ownershipMintingProcessorService.test.ts#L1).

5. A blockchain gateway-k hibamodellezése egységesebb lett. A korábbi eltérés megszűnt, a konfigurációs és validációs hibák most konzisztensen `DomainError` alapúak, lásd [ethersTokenizationGateway.ts](/Users/kukodajanos/Workspace/cityzeen-tdd/src/infrastructure/gateways/ethersTokenizationGateway.ts#L1) és [ethersOwnershipMintingGateway.ts](/Users/kukodajanos/Workspace/cityzeen-tdd/src/infrastructure/gateways/ethersOwnershipMintingGateway.ts#L1).

6. A pagination helperben megszűnt a kettős castolásos generikus workaround. A jelenlegi implementáció a `nextToken`-t közvetlen paraméterként kezeli, lásd [pagination.ts](/Users/kukodajanos/Workspace/cityzeen-tdd/src/infrastructure/amplify/pagination.ts#L1). A rá épülő hívások ehhez igazodtak, például [amplifyChatRepository.ts](/Users/kukodajanos/Workspace/cityzeen-tdd/src/infrastructure/repositories/amplifyChatRepository.ts#L1) és [chat claim route](/Users/kukodajanos/Workspace/cityzeen-tdd/app/api/chat/claim/route.ts#L1).

7. A Vitest konfiguráció már tartalmaz coverage thresholdot és coverage providert, lásd [vitest.config.ts](/Users/kukodajanos/Workspace/cityzeen-tdd/vitest.config.ts#L1) és [package.json](/Users/kukodajanos/Workspace/cityzeen-tdd/package.json#L1). A korábbi minőségi hiányosság, hogy a zöld tesztfutás nem jelentett semmilyen coverage elvárást, ezzel technikailag lezárva.

8. A korábbi `@next/next/no-img-element` warningok megszűntek. Az érintett UI elemek `next/image` használatra álltak át, például [BlogDetails.tsx](/Users/kukodajanos/Workspace/cityzeen-tdd/components/blog/BlogDetails.tsx#L1), [BlogList.tsx](/Users/kukodajanos/Workspace/cityzeen-tdd/components/blog/BlogList.tsx#L1), [Navbar.tsx](/Users/kukodajanos/Workspace/cityzeen-tdd/components/navigation/Navbar.tsx#L1), [Hero.tsx](/Users/kukodajanos/Workspace/cityzeen-tdd/components/sections/Hero.tsx#L1), [PhotoCta.tsx](/Users/kukodajanos/Workspace/cityzeen-tdd/components/sections/PhotoCta.tsx#L1), [Card.tsx](/Users/kukodajanos/Workspace/cityzeen-tdd/components/ui/Card.tsx#L1), [Carousel.tsx](/Users/kukodajanos/Workspace/cityzeen-tdd/components/ui/Carousel.tsx#L1), valamint a szükséges remote image config bekerült a [next.config.js](/Users/kukodajanos/Workspace/cityzeen-tdd/next.config.js#L1) fájlba.

## Jelenlegi állapotkép

- A `npm test` zöld: 29 tesztfájl, 155 teszt sikeresen lefutott.
- A `npm run lint` zöld: nincs aktív ESLint warning vagy error.
- A `npx tsc --noEmit` zöld: nincs aktív TypeScript fordítási hiba.
- A VS Code hibalista tiszta a módosított fájlokra nézve.

## Maradék kockázatok

1. A repository façade elnevezés és a széles `InvestmentRepository` interface továbbra is hordoz némi architekturális súlyt, még akkor is, ha az implementáció már delegáló és felbontott. Ez már nem kritikus kockázat, inkább középtávú tisztítási lehetőség.

2. A coverage threshold konfigurálva van, de ebben a körben nem készült tényleges coverage riport és nem lett számszerűen kiértékelve a jelenlegi lefedettség. A policy tehát bent van, a coverage állapot mérési oldala még külön futtatást igényel.

3. A dependency állapot továbbra sem auditált ebben a fájlfrissítési körben. A korábbi `npm install` kimenet alapján a dependency tree-ben maradtak sebezhetőségek, így ez a terület továbbra is külön security-karbantartási feladat.

4. A lint futás során továbbra is megjelenik egy ökoszisztéma-kompatibilitási figyelmeztetés: a jelenlegi TypeScript verzió magasabb, mint amit az adott `@typescript-eslint/typescript-estree` hivatalosan támogat. Ez nem blokkoló, de érdemes a toolchain verzióit hosszabb távon összehangolni.

## Végkövetkeztetés

A korábbi audit legfontosabb technikai findingjai javítva lettek, és a projekt jelenleg lényegesen jobb állapotban van, mint az előző állapotjelentés idején. A mostani minőségi profil alapján a közvetlen kódminőségi és karbantarthatósági kockázatok többsége közepes vagy annál alacsonyabb szintre csökkent. A következő reális fókusz már nem a belső szerkezeti sürgősségi javítás, hanem a coverage tényleges mérése és a dependency security karbantartása.
