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

#### `/checkout`

- Explicit checkout oldal.
- A `Go to Checkout` gomb erre a route-ra navigáljon.
- A page a kiválasztott listing/product alapján töltse be az adatokat.
- A `Place Order` innen is az `/investor/orders/:orderId` oldalra vigyen.
- Itt választja ki a fizetési típust.
- Ha csak egy Product van, akkor ne legyen dropdown

#### `/login`

- Bejelentkezés.
- Sikeres login után a nyitólapra (`/`) navigál.
- Használd a `components/SectionContainer.tsx`-t

#### `/register`

- Regisztráció.
- Ha nincs bejelentkezve felhasználó, a Navbarban a `Registration` menüpont látszódjon.
- Login és regisztrácio kozott lehessen keresztül navigálni.
- Ne legyen role választo
- Használd a `components/SectionContainer.tsx`-t

#### `/settings`

- Belépés role-specifikus beállításokhoz.

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
