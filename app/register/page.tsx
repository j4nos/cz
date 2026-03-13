import Link from "next/link";

import { SectionContainer } from "@/components/SectionContainer";

export default function RegisterPage() {
  return (
    <SectionContainer>
      <h1>Register</h1>
      <form action="/" method="get">
        <label>
          Email
          <input name="email" type="email" />
        </label>
        <label>
          Country
          <input name="country" type="text" />
        </label>
        <button type="submit">Create account</button>
      </form>
      <p>
        <Link href="/login">Already registered?</Link>
      </p>
    </SectionContainer>
  );
}
