import Link from "next/link";

export default function NotFound() {
  return (
    <section>
      <h1>Not found</h1>
      <p>The requested page does not exist.</p>
      <Link href="/">Go home</Link>
    </section>
  );
}
