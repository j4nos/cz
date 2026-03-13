import Link from "next/link";

export default function SettingsPage() {
  return (
    <section>
      <h1>Settings</h1>
      <p>Select a role-specific settings area.</p>
      <nav>
        <Link href="/asset-provider/settings">Asset provider settings</Link>{" "}
        <Link href="/investor/settings">Investor settings</Link>
      </nav>
    </section>
  );
}
