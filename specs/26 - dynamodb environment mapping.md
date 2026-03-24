# DynamoDB environment mapping

Ez a jelenlegi beazonosított mapping a `cityzeen-tdd` környezetekhez.

Fontos:
- ez nem az AWS által hivatalosan címkézett environment név, hanem a mostani rendszerből visszafejtett megfeleltetés
- a mapping a jelenlegi local `amplify_outputs.json`, a Cognito pool nevek, és a konkrét DynamoDB rekordellenőrzések alapján készült

## Local

Az aktuális local backendhez ez a táblacsalád tartozik:

- `Asset-dvfg4xhrlnap7cgsiozncmtuxy-NONE`
- `Listing-dvfg4xhrlnap7cgsiozncmtuxy-NONE`
- `Product-dvfg4xhrlnap7cgsiozncmtuxy-NONE`
- `Order-dvfg4xhrlnap7cgsiozncmtuxy-NONE`
- `UserProfile-dvfg4xhrlnap7cgsiozncmtuxy-NONE`
- `PlatformSettings-dvfg4xhrlnap7cgsiozncmtuxy-NONE`
- és ugyanilyen `dvfg4xhrlnap7cgsiozncmtuxy` suffixű többi modell tábla

Azonosítás alapja:
- local auth pool: `eu-central-1_e20lrFXTH`
- a korábbi local asset/user profile ellenőrzések ehhez a `dvfg4xhrlnap7cgsiozncmtuxy` táblacsaládhoz passzoltak

## Prod / main

A jelenlegi prod/main adatokhoz ez a táblacsalád tartozik:

- `Asset-7g4euun34za73pdquisdefejo4-NONE`
- `Listing-7g4euun34za73pdquisdefejo4-NONE`
- `Product-7g4euun34za73pdquisdefejo4-NONE`
- `Order-7g4euun34za73pdquisdefejo4-NONE`
- `UserProfile-7g4euun34za73pdquisdefejo4-NONE`
- `PlatformSettings-7g4euun34za73pdquisdefejo4-NONE`
- és ugyanilyen `7g4euun34za73pdquisdefejo4` suffixű többi modell tábla

Azonosítás alapja:
- a prod URL-ekről ellenőrzött listing ID-k:
  - `id-1774178344650-7ouv1n`
  - `id-1774380127000-n5l2y8`
- ezek a `Listing-7g4euun34za73pdquisdefejo4-NONE` táblában léteznek, `saleStatus = open` állapottal

## Egyéb táblacsaládok

A régióban jelenleg még ezek a Listing táblacsaládok látszanak:

- `Listing-5zqyx7bzg5envkmpiodth35sie-NONE`
- `Listing-qy6kcwb3yfgwjoi7mn3pi3svmi-NONE`
- `Listing-t6k2scwh2vd4dd6wr3l7b225ry-NONE`

Ezekhez ebben a dokumentumban most nincs biztos environment-hozzárendelés.

## Gyakorlati szabály

Ha ellenőrizni akarod, hogy egy rekord local vagy prod:

1. Nézd meg, melyik táblacsaládban létezik az adott `id`.
2. `dvfg4xhrlnap7cgsiozncmtuxy` = local
3. `7g4euun34za73pdquisdefejo4` = prod/main

## Megjegyzés

A korábbi probléma, amikor a prod publikus listing oldal `not found`-ot adott, nem azért volt, mert a rekord hiányzott, hanem mert:

- a publikus oldal `apiKey` authot használt
- a `Listing` modellen nem volt public read szabály

Ezt külön javítottuk a schema-ban.
