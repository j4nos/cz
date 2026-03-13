import Link from "next/link";

export function Navbar() {
  return (
    <header>
      <nav aria-label="Primary navigation">
        <Link href="/">Cityzeen</Link> <Link href="/blog">Blog</Link> <Link href="/asset-provider">Asset Provider</Link>{" "}
        <Link href="/investor">Investor</Link> <Link href="/register">Registration</Link> <Link href="/logout">Logout</Link>
      </nav>
    </header>
  );
}
