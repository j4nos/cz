#### `components/navigation/Navbar.tsx`

- globális felső navigáció és auth-state alapú menümegjelenítés.
  - baloldalt: logo
  - kozépen:
    - Blog
    - Asset provider
    - Investor
  - jobboldalt:
    - Register
- 640px alatt a kozépső szekvio ne látszodjon, csak baloldalt a logo, jobboldalt egy hamburger
- a flex ne váltson át mobilon
- hamburger vigyen át egy `menu` oldalra
- Ha be van jelentkezve jobboldalt mutasson egy logout-ot
- kijelentkezés után dobjon a nyitolapra

#### `components/CreateEditListing.tsx`

- Listing attributumok.
- Save Lsting button
- Sales Status: Open / Closed.
  - Létrehozáskor legyen Closed az állapota.
  - Closed-rol ne lehessen Open-re váltani, ha:
    - kezdő és végdátum adott és közötte vagyunk
    - ha legalább egy kép meg van adva
    - ha legalább egy product meg van adva
  - Open-ről, bármikor lehessen Closed-ra váltani
  - Az első feltételt ami nem teljesül, jelenitsük meg hiányként
- Link a listing details oldalra
- Create product PlainCta.
- Termékek táblázata `Details` linkekkel.
- `Remove Product` gomb. S majd vigyen vissza a listingre.
- Ha `edit`-rol lett betoltve, akkor a paraméterként kapott listingId-hoz kapcsolodó listinget toltsd be.
- Ha `create`-rol lett betoltve, akkor generáljon egy listingId-t.
- PlainCta: `Delete listing` button

#### `components/listings.tsx`

- Card legyen benne egy 100px x 100px-es fotoval az asset első fotójára
- Legyen link button a `/listings/:listingId`-ra
- A Card 400px x 150px legyen
- Legyen rajta:
  - Asset neve
  - Listing minimál ára
- Csak `Open` statusú listinget mutassunk, ami a megengedett időtartományban van.

#### `components/listing.tsx`

- Egy listing részlete.
- Listing page (visitor nézet):
  - bal oldal: carousel
    - A Carousel az assethez megadott fotókat mutassa.
  - jobb oldalt:
    - listing neve
    - leírása
    - form:
      - termék választás
      - mennyiség
      - coupon
    - ár
      - Az árat számoljuk újra a mennyiség alapján a kedvezményeket figyelembe véve.
    - `Go to Checkout`
- Ha csak egy Product van, akkor ne legyen dropdown

#### `components/sections/SectionContainer.tsx`

- Egy section, aminek a kozepén van egy max 400px-es container, s ebbe jon a paraméterként kapott content

#### `components/chat/ChatLauncher.tsx`

- Legyen egy mindig látható chatablakot nyitó gomb a jobb alsó sarokban a footer felett.
- A chat ablak megnyitását követően a megnyitó gomb ne látszódjon.

#### `components/chat/ChatPanel.tsx`

- Ezt megnyomva töltődjön be egy, a fő panel mellé jobbra desktopon 300px-et elfoglaló panel.
- A chatablak legyen sticky.
- Magassága legyen a teljes képernyő magassága, minusz a header és a footer.
- Ha megnyílt a chatablak, akkor a content mellett csak 8px margin-t használjunk desktopon.
- Mobilon egy külön oldalon nyíljon meg a chat ablak.
- A chat ablakban legyenek szövegbuborékok, amiket a kliens és AI küld.
- Alul legyen egy beviteli szövegdoboz, egy küldés, egy csatolás gomb, egy diktafon gomb és egy spinner.
- Használj Font Awesome ikonokat
- Felül lehessen új threadet hozzáadni, és a chat ablakot bezárni.
- Alatta mutasson 3 threadet, illetve egy more gombot.

#### `components/blog/BlogList.tsx`

- A `/blog` oldal fő komponense.
- Blog bejegyzés listát rendereljen kártyákkal.
- Kártya mezők:
  - borítókép
  - cím
  - kivonat
  - publikálási dátum
  - `Read more` link a `/blog/:blogId` oldalra
- Kezeljen üres állapotot is.

#### `components/blog/BlogDetails.tsx`

- A `/blog/:blogId` oldal fő komponense.
- Jelenítse meg a blog:
  - címét
  - borítóképét
  - publikálási dátumát
  - HTML tartalmát
- A HTML tartalom renderelése legyen biztonságos (XSS védelem).

#### `components/platform-admin/BlogPostForm.tsx`

- Blog bejegyzés létrehozó/szerkesztő űrlap platform admin részre.
- Mezők:
  - title
  - excerpt
  - cover image (feltöltés vagy URL)
  - contentHtml (HTML editor textarea)
  - publishedAt
  - status (`draft`, `published`)
- Validáció: kötelező mezők, hibák jelenjenek meg mentés előtt.

#### `components/platform-admin/BlogPostsTable.tsx`

- Platform admin blog lista táblázat.
- Soronként mutassa:
  - cím
  - státusz
  - publikálási dátum
  - utolsó módosítás
  - műveletek: `Edit`, `Delete`
