# Next.js ISR vs CSR (App Router)

## 1. ISR (Incremental Static Regeneration) App Routerben

App Router esetén az ISR-t a `fetch` cache-elésével és a `revalidate` opcióval állítod be.

### Példa:

```ts
// app/posts/page.tsx

async function getPosts() {
  const res = await fetch('https://api.example.com/posts', {
    next: { revalidate: 60 } // 60 másodpercenként újragenerál
  })

  return res.json()
}

export default async function Page() {
  const posts = await getPosts()

  return (
    <div>
      {posts.map((post: any) => (
        <div key={post.id}>{post.title}</div>
      ))}
    </div>
  )
}
```

### Mit csinál ez?

* Az oldal statikusan generálódik build során
* A cache 60 másodpercig érvényes
* Ha lejár, a következő requestnél újragenerálódik (backgroundban)

---

## 2. ISR route szinten

```ts
export const revalidate = 60
```

Ez az egész route-ra vonatkozik.

---

## 3. Mikor lesz CSR egy oldal?

App Routerben alapból Server Component-ek vannak, tehát NEM CSR.

CSR akkor történik, ha:

### 1. `use client`

```ts
'use client'

import { useEffect, useState } from 'react'

export default function Page() {
  const [data, setData] = useState(null)

  useEffect(() => {
    fetch('/api/data')
      .then(res => res.json())
      .then(setData)
  }, [])

  return <div>{JSON.stringify(data)}</div>
}
```

➡️ Ez full CSR (browserben fetch)

---

### 2. `cache: 'no-store'`

```ts
await fetch(url, { cache: 'no-store' })
```

➡️ Ez mindig request-time fetch → SSR (nem ISR)

---

### 3. Dynamic rendering

```ts
import { cookies } from 'next/headers'

export default function Page() {
  const cookieStore = cookies()

  return <div>{cookieStore.get('theme')?.value}</div>
}
```

➡️ Ez dynamic SSR (nem cache-elhető)

---

## 4. Összefoglaló

| Rendering | Hogyan                   | Mikor            |
| --------- | ------------------------ | ---------------- |
| SSG       | static fetch             | build time       |
| ISR       | `revalidate`             | időnként frissül |
| SSR       | `no-store` / dynamic     | minden request   |
| CSR       | `use client` + useEffect | browserben       |

---

## 5. Mikor melyiket használd?

### ISR:

* blog
* marketing oldal
* ritkán frissülő adatok

### SSR:

* user-specific adat
* auth
* dashboard

### CSR:

* interaktív UI
* client-only state

---

Ha akarod, meg tudom mutatni:

* ISR + on-demand revalidation (webhook)
* cache invalidation stratégiák
* Next.js interjú tipikus kérdések 🔥
