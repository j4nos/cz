import Link from "next/link";

export default function InvestorDashboardPage() {
  return (
    <section>
      <h1>Investor dashboard</h1>
      <nav>
        <Link href="/investor/listings">Browse listings</Link> <Link href="/investor/orders">Orders</Link>{" "}
        <Link href="/investor/portfolio">Portfolio</Link> <Link href="/investor/kyc">KYC</Link>
      </nav>
    </section>
  );
}
