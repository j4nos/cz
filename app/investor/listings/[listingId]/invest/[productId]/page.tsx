import { Suspense } from "react";

import { InvestorInvestPageClient } from "@/components/InvestorInvestPageClient";

export default function InvestorInvestPage() {
  return (
    <Suspense fallback={<p>Loading checkout...</p>}>
      <InvestorInvestPageClient />
    </Suspense>
  );
}
