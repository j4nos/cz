# useCallback – Mikor és miért?

## 🔹 Mi a useCallback?

A `useCallback` egy függvény memoizálására szolgál.

👉 Csak akkor hoz létre új függvényt, ha a dependency-k változnak.

---

## 🔥 Alap probléma (useCallback nélkül)

Minden rendernél új függvény jön létre:

```tsx
const Parent = () => {
  const [count, setCount] = useState(0);

  const handleClick = () => {
    console.log("clicked");
  };

  return <Child onClick={handleClick} />;
};
```

👉 Itt a `handleClick` minden rendernél új referencia lesz
👉 Emiatt a `Child` újrarenderel akkor is, ha nem kéne

---

## ⚠️ Mikor probléma ez?

Ha a child memoizált:

```tsx
const Child = React.memo(({ onClick }) => {
  console.log("Child render");
  return <button onClick={onClick}>Click</button>;
});
```

👉 A `React.memo` nem segít, mert a függvény referencia mindig változik

---

## ✅ Megoldás useCallback-kel

```tsx
const Parent = () => {
  const [count, setCount] = useState(0);

  const handleClick = useCallback(() => {
    console.log("clicked");
  }, []);

  return <Child onClick={handleClick} />;
};
```

👉 A függvény referencia stabil marad
👉 A `Child` nem renderelődik újra feleslegesen

---

## 🔥 Fő különbség

| useCallback nélkül           | useCallback-kel         |
| ---------------------------- | ----------------------- |
| új függvény minden rendernél | stabil referencia       |
| child újrarenderel           | child nem renderel újra |
| performance romolhat         | optimalizált            |

---

## 🚀 Mikor használd?

Használd `useCallback`-et, ha:

* Függvényt adsz át child komponensnek
* A child memoizált (`React.memo`)
* Nagy vagy komplex komponensfa van
* El akarod kerülni a felesleges renderelést

---

## ⚠️ Mikor NEM kell?

* Ha nincs child prop átadás
* Ha a child nem memoizált
* Ha nincs performance probléma

👉 useCallback túlhasználata felesleges

---

## 🧠 Tipikus hiba (interjún fontos!)

👉 Nem veszik észre, hogy:

* a függvény minden rendernél új
* emiatt memoizált child is újrarenderel

---

## 🧠 Interjú válasz

"A useCallback-et akkor használom, ha egy függvényt adok át memoizált child komponensnek, és el akarom kerülni, hogy a függvény referencia változása miatt felesleges újrarenderelés történjen."
