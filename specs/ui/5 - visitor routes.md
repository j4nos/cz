#### `/`

- Landing oldal, legyen itt egy hero, és két kiemelt listing.
- A hero-ban legyen baoldalt egy real estate foto, jobboldalt h2, p, és 2 link.
- A kiemelt listingek a `/platform-admin/homepage-cta`-on megadott két listinget mutassa a CTA-kban PhotoCta-val.
- Használd az assetId-kat és listingId-kat.
- Jelenitsd meg az elso fotoját az assetnek

#### `/listings`

- Publikus listing-ek
- Használd ezt: `components/listings.tsx`

#### `/listings/:listingId`

- Használd ezt: `components/listing.tsx`

#### `/login`

- Bejelentkezés.
- Sikeres login után a nyitólapra (`/`) navigál.
- Használd a `components/SectionContainer.tsx`-t

#### `/register`

- Regisztráció.
- Ha nincs bejelentkezve felhasználó, a Navbarban a `Registration` menüpont látszódjon.
- Login és regisztrácio kozott lehessen keresztül navigálni.
- Minden user egyszerre asset provider és investor.
- Használd a `components/sections/SectionContainer.tsx`-t

#### `/settings`

- Belépés a felhasználó beállítási teruleteire.
- A user innen el tudja érni mind az asset provider, mind az investor settings oldalakat.

#### `/blog`

- Publikus blog lista oldal.
- Blog bejegyzés kártyák jelenjenek meg (borítókép, cím, rövid kivonat, publikálási dátum).
- A kártyák kattinthatóak legyenek a blog details oldalra.
- Legyen üres állapot, ha nincs publikus bejegyzés.

#### `/blog/:blogId`

- Publikus blog részletező oldal.
- Mutassa a bejegyzés címét, borítóképét, publikálási dátumát és teljes tartalmát.
- A tartalom HTML-ként jelenjen meg (a platform admin által megadott tartalom).
- Ha nem létező `blogId` érkezik, menjen `not-found` oldalra.
