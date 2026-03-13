#### `/investor`

- Investor dashboard.

#### `/investor/listings`

- Investor listing böngészés.
- Használd ezt: `components/listings.tsx`

#### `/investor/listings/:listingId`

- Használd ezt: `components/listing.tsx`

#### `/investor/listings/:listingId/invest/:productId`

- Befektetés/checkout flow.
- A `Place Order` a checkouton az `/investor/orders/:orderId` oldalra vigyen.

#### `/investor/orders`

- Order táblázat.
- A status badge-vel jelenjen meg.

#### `/investor/orders/:orderId`

- Order részlet.
- Checkout utáni sikeres rendelés céloldala.

#### `/investor/portfolio`

- Portfólió összegzés.
- Táblázat mutassa a befektető megvalósult befektetéseit.
- Minden sorban legyen egy badge ami ownershipet reprezentálja:
  - platforon
  - tokenben
- Ha platforon van, akkor legyen egy `Withdraw in wallet` gomb is.

#### `/investor/kyc`

- PlainCta: Start KYC
- Image placeholder egy embedded kyc iframe-nek
- Status badge

#### `/investor/subscriptions`

- Subscription kezelő oldal.

#### `/investor/settings`

- Investor beállítások.
