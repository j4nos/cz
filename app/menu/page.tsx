"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { useAuth } from "@/contexts/AuthContext";

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

const platformAdminMenu: MenuItem[] = [
  { label: "Homepage CTA", href: "/platform-admin/homepage-cta" },
  { label: "Blog Posts", href: "/platform-admin/blog-posts" },
];

export default function MenuPage() {
  const { isAuthenticated, user, logout, loading, isAdmin } = useAuth();
  const router = useRouter();

  return (
    <div className="vertical-stack-with-gap">
      <h1>Menu</h1>

      <section className="vertical-stack-with-gap">
        <h2>Blog</h2>
        <div className="vertical-stack-with-gap">
          <Link href="/blog">Posts</Link>
        </div>
      </section>

      {loading ? <p className="muted">Loading menu…</p> : null}

      {!loading && isAuthenticated ? (
        <>
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

          {isAdmin ? (
            <section className="vertical-stack-with-gap">
              <h2>Platform admin</h2>
              <div className="vertical-stack-with-gap">
                {platformAdminMenu.map((item) => (
                  <Link key={item.href} href={item.href}>
                    {item.label}
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          <section className="vertical-stack-with-gap">
            <h2>Account</h2>
            <p className="muted">{user?.email ?? "Signed in"}</p>
            <Button
              type="button"
              variant="ghost"
              onClick={async () => {
                await logout();
                router.push("/");
              }}
            >
              Logout
            </Button>
          </section>
        </>
      ) : null}

      {!loading && !isAuthenticated ? (
        <section className="vertical-stack-with-gap">
          <h2>Account</h2>
          <div className="vertical-stack-with-gap">
            <Link href="/login">Login</Link>
            <Link href="/register">Registration</Link>
          </div>
        </section>
      ) : null}
    </div>
  );
}
