"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { usePublicAuth } from "@/contexts/AuthContext";

export function PlatformAdminRouteGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { loading, isAuthenticated, isAdmin } = usePublicAuth();

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!isAuthenticated) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }

    if (isAdmin) {
      return;
    }

    router.replace("/");
  }, [isAdmin, isAuthenticated, loading, pathname, router]);

  if (loading || !isAuthenticated || !isAdmin) {
    return null;
  }

  return <>{children}</>;
}
