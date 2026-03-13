import { Suspense } from "react";

import { CheckoutPageClient } from "@/components/CheckoutPageClient";

export default function CheckoutPage() {
  return (
    <Suspense fallback={<p>Loading checkout...</p>}>
      <CheckoutPageClient />
    </Suspense>
  );
}
