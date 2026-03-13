import { PlainCta } from "@/components/sections/PlainCta";

export default function InvestorDashboardPage() {
  return (
    <div className="vertical-stack-with-gap">
      <header>
        <h1>Investor Dashboard</h1>
        <p className="muted">Quick access to your investing tools.</p>
      </header>
      <PlainCta
        title="Browse listings"
        text="Find opportunities that match your strategy and start an investment checkout."
        actionLabel="View listings"
        href="/investor/listings"
      />
      <PlainCta
        title="Track your orders"
        text="See your latest orders and payment status across providers."
        actionLabel="Orders"
        href="/investor/orders"
      />
      <PlainCta
        title="Portfolio overview"
        text="Review paid investments and their allocations."
        actionLabel="Open portfolio"
        href="/investor/portfolio"
      />
    </div>
  );
}
