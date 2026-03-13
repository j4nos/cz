import type { ReactNode } from "react";

export function SectionContainer({ children }: { children: ReactNode }) {
  return (
    <section>
      <div>{children}</div>
    </section>
  );
}
