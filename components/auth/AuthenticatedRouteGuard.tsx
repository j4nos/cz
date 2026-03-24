"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { usePublicAuth } from "@/contexts/AuthContext";

export function AuthenticatedRouteGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isAuthenticated, loading } = usePublicAuth();

  useEffect(() => {
    if (loading || isAuthenticated) {
      return;
    }

    const search = searchParams.toString();
    const next = `${pathname}${search ? `?${search}` : ""}`;
    router.replace(`/login?next=${encodeURIComponent(next)}`);
  }, [isAuthenticated, loading, pathname, router, searchParams]);

  if (loading || !isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
