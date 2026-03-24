"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { usePublicAuth } from "@/contexts/AuthContext";

export function AuthenticatedRouteGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, loading } = usePublicAuth();

  useEffect(() => {
    if (loading || isAuthenticated) {
      return;
    }

    router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [isAuthenticated, loading, pathname, router]);

  if (loading || !isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
