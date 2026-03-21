"use client";

import Link from "next/link";

type MenuItem = {
  label: string;
  href: string;
};

const assetProviderMenu: MenuItem[] = [
  { label: "Dashboard", href: "/asset-provider" },
  { label: "Assets", href: "/asset-provider/assets" },
  { label: "Orders", href: "/asset-provider/orders" },
  { label: "Settings", href: "/asset-provider/settings" },
];

const investorMenu: MenuItem[] = [
  { label: "Dashboard", href: "/investor" },
  { label: "Listings", href: "/investor/listings" },
  { label: "Orders", href: "/investor/orders" },
  { label: "Portfolio", href: "/investor/portfolio" },
  { label: "KYC", href: "/investor/kyc" },
  { label: "Settings", href: "/investor/settings" },
];

export default function MenuPage() {
  return (
    <div className="vertical-stack-with-gap">
      <h1>Menu</h1>

      <section className="vertical-stack-with-gap">
        <h2>Blog</h2>
        <div className="vertical-stack-with-gap">
          <Link href="/blog">Posts</Link>
        </div>
      </section>

      <section className="vertical-stack-with-gap">
        <h2>Investor</h2>
        <div className="vertical-stack-with-gap">
          {investorMenu.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </div>
      </section>

      <section className="vertical-stack-with-gap">
        <h2>Asset provider</h2>
        <div className="vertical-stack-with-gap">
          {assetProviderMenu.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
