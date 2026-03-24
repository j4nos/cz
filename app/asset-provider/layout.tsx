import type { ReactNode } from "react";

import { AuthenticatedRouteGuard } from "@/components/auth/AuthenticatedRouteGuard";

export default function AssetProviderLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <AuthenticatedRouteGuard>{children}</AuthenticatedRouteGuard>;
}
