"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useLoading } from "@/contexts/LoadingContext";
import { Button } from "@/components/ui/Button";
import styles from "./Navbar.module.css";

type MenuItem = {
  label: string;
  href: string;
};

const LOGO_URL = "/images/branding/logo.png";

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

function Dropdown({ label, items }: { label: string; items: MenuItem[] }) {
  return (
    <div className={styles.dropdown}>
      <button className={styles.dropdownTrigger} type="button">
        {label}
      </button>
      <div className={styles.dropdownMenu}>
        {items.map((item) => (
          <Link
            className={styles.dropdownItem}
            key={item.href}
            href={item.href}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

export function Navbar() {
  const { isAuthenticated, user, profile, logout, loading } = useAuth();
  const { isLoading } = useLoading();
  const router = useRouter();
  const isPlatformAdmin = profile?.role === "platform-admin";

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.left}>
          <Link href="/" className={styles.brand} aria-label="Cityzeen home">
            <img src={LOGO_URL} alt="Cityzeen" className={styles.logo} />
          </Link>
        </div>

        <nav className={styles.center} aria-label="Main navigation">
          <Link href="/blog" className={styles.navLink}>
            Blog
          </Link>
          {!loading && isAuthenticated ? (
            <>
              <Dropdown label="Asset Provider" items={assetProviderMenu} />
              <Dropdown label="Investor" items={investorMenu} />
              {isPlatformAdmin ? (
                <Dropdown label="Platform Admin" items={platformAdminMenu} />
              ) : null}
            </>
          ) : null}
        </nav>

        <div className={styles.right}>
          {loading || isLoading ? (
            <span
              className={styles.loadingIndicator}
              aria-label="Loading"
              role="status"
            />
          ) : null}
          <Link href="/menu" className={styles.hamburger} aria-label="Open menu">
            <span className={styles.hamburgerIcon} />
          </Link>
          {!loading && isAuthenticated ? (
            <div className={styles.authGroup}>
              <span className={styles.userName}>{user?.email ?? "—"}</span>
              <Button
                variant="ghost"
                onClick={async () => {
                  await logout();
                  router.push("/");
                }}
              >
                Logout
              </Button>
            </div>
          ) : (
            <Link href="/register" className={styles.navLink}>
              Registration
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
