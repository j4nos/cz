#### `/asset-provider`

- Egyenlőre legyen üres.

#### `/asset-provider/assets`

- Egy PlainCta új asset létrehozásához.
- Egy táblázat az assetekkel.
  - A táblázat Firebase-ből a bejelentkezett asset providerhez tartozó asseteket mutassa.
    - A táblázatban legy button szerű link az assetre

#### `/asset-provider/assets/new/step-1`

- Wizard: alap adatok.
- Használd ezt tárolásra: `/contexts/asset-wizard-context.tsx`
- A Step 1-4 linkek közül az aktuális lépés legyen kiemelve.

#### `/asset-provider/assets/new/step-2`

- Wizard: media.
- Lehessen fotót feltölteni.
- A fotók Firebase-ben az asset ID + sorszám szerint tárolódjanak.
- Az asset tárolja, hány kép lett feltöltve.
- Lehessen képfeltöltés nélkul is tovább lépni.

#### `/asset-provider/assets/new/step-3`

- Wizard: dokumentumok.
- Lehessen dokumentumot feltölteni.
- Minden dokumentumhoz jöjjön létre egy `Document` metaadat rekord.
- Lehessen dokumentum feltöltés nélkul is tovább lépni.

#### `/asset-provider/assets/new/step-4`

- Wizard: review + submit.
- `Submit asset` után jöjjön létre az asset.
- Csak a step 4-ben hozza létre az assetet, ne előtte. Előtte csak a `/contexts/asset-wizard-context.tsx`-ben tárolja.

#### `/asset-provider/assets/:assetId`

- Asset contract address.
- Edit asset basic info in a form
- Legyen egy PlainCta listing hozzáadásához.
- Link az asset contractra
  - Mobilon link helyett PlainCTA legyen
  - Használj globális isMobile, isDesktop stilusokat
- Alatta listing táblázat jelenjen meg.
- A táblázat minden sorában legyen `Details` ami a pricing oldalra visz át: `/asset-provider/assets/:assetId/listings/:listingId/edit`
- Képfeltöltés
- Feltöltött képek egy Carousel-ben
- `Remove last photo` button
- Dokumentum feltöltés
- Tablázatban a már feltöltött dokumentumok
- `Delete asset` button
- Edit asset basic info in a form
- `Delete asset` button

#### `/asset-provider/assets/:assetId/due-diligence/:runId`

- Due diligence eredmény.

#### `/asset-provider/assets/:assetId/create`

- Használd ezt: `components/create-edit-listing.tsx`

#### `/asset-provider/assets/:assetId/listings/:listingId/edit`

- Használd ezt: `components/create-edit-listing.tsx`
- Add át paraméterként a kapott listingId-t

#### `/asset-provider/assets/:assetId/listings/:listingId/pricing`

- Product attributomok beállítás
- Mentés gomb
- Productonkénti pricing tier (quantity discount) beállítás.

#### `/asset-provider/orders`

- Provider oldali orderek egy táblázatban.
- A status badge-vel jelenjen meg.
- Lehessen a rendeléseket befizetettre állítani buttonnal soronként

#### `/asset-provider/settings`

- Provider beállítások.

### `app/asset-provider/assets/[assetId]/listings/[listingId]/pricing/page.tsx`

- Product attributes in form.
- Pricing tier creation form.
- Pricing tier táblázata `Remove` gombokkal.
- PlainCta: `Delete Product` button
