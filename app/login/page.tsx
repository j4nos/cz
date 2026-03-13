import Link from "next/link";

import { SectionContainer } from "@/components/SectionContainer";

export default function LoginPage() {
  return (
    <SectionContainer>
      <h1>Login</h1>
      <form action="/" method="get">
        <label>
          Email
          <input name="email" type="email" />
        </label>
        <label>
          Password
          <input name="password" type="password" />
        </label>
        <button type="submit">Login</button>
      </form>
      <p>
        <Link href="/register">Need an account?</Link>
      </p>
    </SectionContainer>
  );
}
