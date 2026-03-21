"use client";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ reset }: GlobalErrorProps) {
  return (
    <html lang="en">
      <body>
        <main className="vertical-stack-with-gap" style={{ padding: "2rem" }}>
          <h1>Something went wrong</h1>
          <p className="muted">
            An unexpected error occurred. Please try again.
          </p>
          <button type="button" onClick={reset}>
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
