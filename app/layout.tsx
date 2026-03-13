import type { Metadata } from "next";
import type { ReactNode } from "react";
import { DM_Serif_Display, Nunito_Sans } from "next/font/google";

import { AppShell } from "@/components/layout/AppShell";
import { Toast } from "@/components/toast/Toast";
import { AuthProvider } from "@/contexts/AuthContext";
import { LoadingProvider } from "@/contexts/LoadingContext";
import { ToastProvider } from "@/contexts/ToastContext";

import "./globals.css";

const dmSerif = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
});

const nunitoSans = Nunito_Sans({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-body",
  adjustFontFallback: false,
});

export const metadata: Metadata = {
  title: "Cityzeen",
  description: "Minimal investment flow UI",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={`${dmSerif.variable} ${nunitoSans.variable}`}>
        <AuthProvider>
          <LoadingProvider>
            <ToastProvider>
              <AppShell>{children}</AppShell>
            </ToastProvider>
          </LoadingProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
