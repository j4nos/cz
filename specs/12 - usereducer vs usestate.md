# useReducer vs useState – Rövid összefoglaló

## 🟢 useState – Mikor használd?

Használd a `useState`-et, ha:

* Egyszerű state-ed van (string, number, boolean)
* Kevés mezőből áll az állapot
* A state-ek nem függenek egymástól
* Egyszerű update logika van

### Példa (useState – form)

```tsx
const [form, setForm] = useState({
  name: "",
  email: "",
});

const setName = (name: string) => {
  setForm(prev => ({ ...prev, name }));
};

const setEmail = (email: string) => {
  setForm(prev => ({ ...prev, email }));
};

const reset = () => {
  setForm({ name: "", email: "" });
};
```

👉 Tipikus use case:

* input mező
* toggle (true/false)
* egyszerű lista

---

## 🔵 useReducer – Mikor használd?

Használd a `useReducer`-t, ha:

### 1. Komplex state van

* több mező
* egymással összefüggnek

### 2. Komplex state változási logika

* több lépés
* conditionök
* async flow-k (loading, success, error)

### 3. State transition fontos

* fontos, hogy pontosan tudd mi történik
* debugolható legyen

### 4. Skálázódó logika

* sok action
* sok state változás

### Példa (useReducer – async flow)

```tsx
function reducer(state, action) {
  switch (action.type) {
    case "fetch_start":
      return { ...state, loading: true, error: null };
    case "fetch_success":
      return { ...state, loading: false, items: action.payload };
    case "fetch_error":
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
}

const [state, dispatch] = useReducer(reducer, {
  items: [],
  loading: false,
  error: null,
});

const fetchData = async () => {
  dispatch({ type: "fetch_start" });

  try {
    const data = await apiCall();
    dispatch({ type: "fetch_success", payload: data });
  } catch (e) {
    dispatch({ type: "fetch_error", payload: "error" });
  }
};
```

---

## 🔥 Kulcskülönbség

| useState          | useReducer                |
| ----------------- | ------------------------- |
| egyszerű state    | komplex state logika      |
| direkt update     | action alapú update       |
| gyors és egyszerű | strukturált és skálázható |
| több setState     | egy dispatch              |

---

## 💡 Mentális modell

* useState → "adat tárolás"
* useReducer → "state machine"

---

## 🧠 Interjú válasz (röviden)

"Egyszerű state-eknél useState-et használok. Ha viszont több state egymással összefügg és a változások logikája komplex, akkor useReducer-t, mert ott explicit módon tudom kezelni a state transition-öket, ami skálázhatóbb és jobban tesztelhető."
