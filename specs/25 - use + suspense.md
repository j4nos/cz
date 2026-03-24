# 🧠 use() + Suspense – rövid, tiszta összefoglaló

## 🔑 Alapötlet

A `use()` + `Suspense` együtt egy új React modell:

👉 **A komponens csak akkor renderelődik, ha az adat már kész**

---

## ⚙️ Hogyan működik?

1. A komponens meghív egy Promise-t:

```jsx
const data = use(fetchData());
```

2. Ha a Promise még nem kész:

👉 a `use()` **eldobja (throw) a Promise-t**

3. A React ezt elkapja:

👉 és a legközelebbi `Suspense` boundary-hoz megy

4. A `Suspense`:
S
👉 megjeleníti a `fallback`-et

```jsx
<Suspense fallback={null}>
  <Component />
</Suspense>
```

5. Amikor a Promise befejeződik:

👉 React újrapróbálja a renderelést
👉 most már a `use()` visszaadja az adatot

---

## 🔄 Teljes flow

```
render
  ↓
use(fetch())
  ↓
Promise pending → throw
  ↓
Suspense fallback
  ↓
Promise resolved
  ↓
újrarender
  ↓
UI megjelenik
```

---

## ⚡ Miért jobb?

* ❌ nincs `useEffect`

* ❌ nincs `useState`

* ❌ nincs manuális loading

* ✅ egyetlen render

* ✅ tiszta, deklaratív kód

* ✅ React kezeli a loadingot

---

## 🧩 Fontos szabályok

* A `use()` csak Promise-ra működik
* Kell köré egy `Suspense`
* Ha nincs `Suspense`, hiba lesz

---

## 💡 Egyszerű mentális modell

👉 **Régen:** render → fetch → update
👉 **Most:** fetch → render

---

## 🧠 TL;DR

👉 `use()`:

* Promise → adat
* ha nincs kész → suspend

👉 `Suspense`:

* elkapja a várakozást
* fallback-et mutat

👉 együtt:

* automatikus async kezelés
* tisztább React kód
