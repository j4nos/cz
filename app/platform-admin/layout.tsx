import type { ReactNode } from "react";

import { PlatformAdminRouteGuard } from "@/components/auth/PlatformAdminRouteGuard";

export default function PlatformAdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <PlatformAdminRouteGuard>{children}</PlatformAdminRouteGuard>;
}
