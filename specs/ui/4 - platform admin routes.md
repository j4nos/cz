#### `/platform-admin/homepage-cta`

- Csak platform admin számára, a nyitólap 2 CTA URL-jének kezelése.
- Az itt megadott két listing jelenjen meg a landing CTA-kban.
- Kérjen be két assetId, listingId párost, first, second.

#### `/platform-admin/blog-posts`

- Csak platform admin számára elérhető blog kezelő oldal.
- Táblázatban/listában mutassa a blog bejegyzéseket.
- Tudjon új blog bejegyzést létrehozni.
- Tudjon meglévő blog bejegyzést szerkeszteni és törölni.
- Bejegyzés mezők:
  - `title` (kötelező)
  - `excerpt` (kötelező, rövid kivonat a lista oldalhoz)
  - `coverImage` (kötelező, 1 db fotó feltöltés vagy URL)
  - `contentHtml` (kötelező, HTML tartalom)
  - `publishedAt` (kötelező, dátum/idő)
  - `status` (`draft` / `published`)
- A `/blog` és `/blog/:blogId` visitor oldalak csak `published` státuszú bejegyzéseket mutassanak.

### Cross-route navigation and auth behavior

- A Navbarban az `Asset Provider` és `Investor` menüelemek csak bejelentkezett állapotban látszódjanak.
- A `Blog` menüpont mindig látszódjon (bejelentkezéstől függetlenül).
- Ha nincs bejelentkezve user, a `Blog` és `Registration` menüpontok látszódjanak.
- Ha be van jelentkezve user, a user neve és egy `Logout` gomb látszódjon.
- Az `Asset Provider` menü alatt legyen: `Dashboard`, `Assets`, `Orders`, `Settings`.
