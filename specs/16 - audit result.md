**Findingok**

1. A `POST /api/tokenize-asset` továbbra is biztonságilag gyenge: a jogosultságot a body-ban kapott `userId` alapján dönti el, bearer token verifikáció nélkül. A kliens még küld `Authorization` headert, de a route nem használja, így a hívó más tenant `userId`-jét is megadhatja. Lásd [route.ts](/Users/kukodajanos/Workspace/cityzeen-tdd/app/api/tokenize-asset/route.ts#L26).

2. Az asset wizard kliensoldalon közvetlenül használja az `AmplifyInvestmentRepository`-t, tehát a UI réteg közvetlenül ír a persistence-be. Ez architekturálisan rossz határ, nehezíti a tesztelést, és a hozzáférés-szabályozást implicit frontend/Amplify wiringra bízza explicit szerveroldali use case helyett. Lásd [page.tsx](/Users/kukodajanos/Workspace/cityzeen-tdd/app/asset-provider/assets/new/step-1/page.tsx#L10) és [page.tsx](/Users/kukodajanos/Workspace/cityzeen-tdd/app/asset-provider/assets/new/step-4/page.tsx#L29).

3. A minting flow még mindig összemossa a `minted` és `withdrawn` állapotot: sikeres mint után az order egyszerre kap `mintedAt` és `withdrawnAt` értéket. Ez torz domain-modell, és később félrevezető portfólió- vagy riportlogikához vezethet. Lásd [ownershipMintingProcessorService.ts](/Users/kukodajanos/Workspace/cityzeen-tdd/src/application/use-cases/ownershipMintingProcessorService.ts#L112).

**Állapot**

A korábbi tokenization regresszió eltűnt: `npm test` zöld, `npx tsc --noEmit` zöld, `npm run lint` csak warningokat ad. A warningok továbbra is a `no-img-element` szabályból jönnek több komponensben.

**Maradék kockázat**

A tesztcsomag még mindig keskeny: 10 API route és 156 `ts/tsx` fájl mellett csak 4 tesztfájl van, és nincs coverage gate. Különösen hiányzik a `mint-ownership` és a Powens route-ok célzott tesztelése.