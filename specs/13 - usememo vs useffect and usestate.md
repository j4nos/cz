# useMemo vs useEffect + useState

## 🔹 useMemo – mire való?

A `useMemo` egy számított érték memoizálására szolgál.

👉 Csak akkor számolja újra az értéket, ha a dependency-k változnak.
👉 Nem hoz létre extra state-et vagy lifecycle logikát.

### Példa (useMemo)

```tsx
const filteredItems = useMemo(() => {
  return items.filter(item => item.includes(search));
}, [items, search]);
```

---

## 🔹 useEffect + useState – alternatíva

Ugyanezt meg lehet oldani `useEffect` + `useState` kombinációval.

👉 Itt külön state-ben tároljuk az eredményt
👉 És effect-ben frissítjük

### Példa (useEffect + useState)

```tsx
const [filteredItems, setFilteredItems] = useState([]);

useEffect(() => {
  const result = items.filter(item => item.includes(search));
  setFilteredItems(result);
}, [items, search]);
```

---

## 🔥 Fő különbségek

| useMemo                 | useEffect + useState   |
| ----------------------- | ---------------------- |
| deklaratív              | imperatív              |
| nincs extra state       | extra state szükséges  |
| nincs side effect       | side effect-et használ |
| egyszerűbb              | több boilerplate       |
| nincs re-render trigger | setState → re-render   |

---

## ⚠️ Problémák useEffect + useState esetén

* Könnyebb hibázni (dependency lista, végtelen loop)
* Két helyen van a logika (effect + state)
* Több re-render történik
* Nehezebb olvasni és karbantartani

---

## 🚀 Mikor használd a useMemo-t?

Használd `useMemo`-t, ha:

* Egy érték **származtatott adat** (derived state)
* Nincs szükség külön state-re
* Csak teljesítmény optimalizálás kell
* Egyértelműen input → output mapping van

👉 Tipikus példák:

* szűrés
* rendezés
* aggregáció
* map/filter/reduce műveletek

---

## 🧠 Mikor NEM kell useMemo?

* Ha a számítás olcsó
* Ha nem okoz performance problémát
* Ha a kód egyszerűbb nélküle

👉 túlhasználni nem érdemes

---

## 🧠 Interjú válasz

"A useMemo-t akkor használom, ha egy érték származtatott adat, és el akarom kerülni a felesleges újraszámítást. Technikailag useEffect + useState-tel is megoldható, de az több boilerplate-et, extra state-et és potenciális hibát hoz be. Ezért ahol nincs szükség side effect-re, ott a useMemo tisztább és deklaratívabb megoldás."
