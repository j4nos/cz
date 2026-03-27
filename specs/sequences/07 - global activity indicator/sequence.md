# Global Activity Indicator

Példa oldal: `app/powens/callback/page.tsx`

Ez a flow azt mutatja meg, hogyan működik a globális activity indicator a `LoadingContext` segítségével:

1. A `RootLayout` a teljes appot `LoadingProvider`-rel csomagolja körbe.
2. A `Navbar` a `useLoading()` hookból olvassa az `isLoading` értéket.
3. A `PowensReturnContent` a `useLoading()` hookból meghívja a `setLoading(key, true|false)` függvényt.
4. A `LoadingProvider` a `counts` mapben kulcsonként számlálja az aktív műveleteket.
5. Ha bármelyik számláló nagyobb mint 0, akkor `isLoading = true`, és a `Navbar` megjeleníti a globális indikátort.
6. Amikor minden futó művelet visszaáll `false`-ra, `isLoading = false`, és az indikátor eltűnik.

```mermaid
sequenceDiagram
    autonumber
    participant U as User
    participant P as "PowensReturnContent page"
    participant LC as "LoadingContext / LoadingProvider"
    participant RC as "ReadController"
    participant PS as "Powens status client"
    participant N as Navbar

    Note over LC,N: A Navbar a globális LoadingContextből olvassa az `isLoading` értéket

    U->>P: Megnyitja a `/powens/callback` oldalt
    P->>LC: `useLoading()` -> `setLoading`
    N->>LC: `useLoading()` -> `isLoading`

    par Első async folyamat: order betöltés
        P->>LC: `setLoading("powens-order", true)`
        LC->>LC: `counts["powens-order"] += 1`
        LC-->>N: `isLoading = true`
        N-->>U: Globális activity indicator megjelenik
        P->>RC: `getOrderById(orderId)`
        RC-->>P: `order`
        P->>LC: `setLoading("powens-order", false)`
        LC->>LC: `counts["powens-order"] -= 1` vagy kulcs törlése
    and Második async folyamat: payment status frissítés
        P->>LC: `setLoading("powens-status", true)`
        LC->>LC: `counts["powens-status"] += 1`
        LC-->>N: `isLoading = true`
        P->>PS: `fetchPowensPaymentStatusClient({ orderId, accessToken })`
        PS-->>P: státusz frissítve
        P->>RC: `getOrderById(orderId)`
        RC-->>P: frissített `order`
        P->>LC: `setLoading("powens-status", false)`
        LC->>LC: `counts["powens-status"] -= 1` vagy kulcs törlése
    end

    alt Van még aktív loading kulcs
        LC-->>N: `isLoading = true`
        N-->>U: Az indicator továbbra is látszik
    else Nincs aktív loading kulcs
        LC-->>N: `isLoading = false`
        N-->>U: Az indicator eltűnik
    end
```

Kapcsolódó fájlok:

- `app/layout.tsx`
- `contexts/LoadingContext.tsx`
- `components/navigation/Navbar.tsx`
- `app/powens/callback/page.tsx`
