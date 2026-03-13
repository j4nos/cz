import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { Navbar } from "@/components/navbar";

import "./globals.css";

export const metadata: Metadata = {
  title: "Cityzeen",
  description: "Minimal investment flow UI",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <main>{children}</main>
        <footer>
          <p>Fake payment provider enabled for the demo flow.</p>
          <nav aria-label="Footer">
            <Link href="/">Home</Link> <Link href="/listings">Listings</Link> <Link href="/blog">Blog</Link>
          </nav>
        </footer>
      </body>
    </html>
  );
}
