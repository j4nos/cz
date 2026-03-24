"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { SectionContainer } from "@/components/sections/SectionContainer";
import { AppLink } from "@/components/ui/AppLink";
import { Button } from "@/components/ui/Button";
import { Form, FormField, FormInput } from "@/components/ui/Form";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import styles from "./page.module.css";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, signInWithGoogle, loading, isAuthenticated } = useAuth();
  const { setToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const nextHref = searchParams.get("next") || "/";

  useEffect(() => {
    if (isAuthenticated) {
      router.replace(nextHref);
    }
  }, [isAuthenticated, nextHref, router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    try {
      await login(email, password);
      router.push(nextHref);
    } catch (err) {
      const errorMessage =
        err &&
        typeof err === "object" &&
        "message" in err &&
        typeof err.message === "string"
          ? err.message
          : null;
      const message =
        errorMessage ?? (err instanceof Error ? err.message : "Login failed");
      setToast(message, "danger", 2500);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogleLogin() {
    setGoogleSubmitting(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      const errorMessage =
        err &&
        typeof err === "object" &&
        "message" in err &&
        typeof err.message === "string"
          ? err.message
          : null;
      setToast(errorMessage ?? "Google login failed", "danger", 2500);
      setGoogleSubmitting(false);
    }
  }

  return (
    <SectionContainer className={styles.page}>
      <h1>Login</h1>
      <br />
      <Form onSubmit={handleSubmit}>
        <FormField label="Email" htmlFor="login-email">
          <FormInput
            id="login-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </FormField>
        <FormField label="Password" htmlFor="login-password">
          <FormInput
            id="login-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </FormField>
        <Button type="submit" disabled={submitting || loading}>
          {submitting ? "Signing in..." : "Login"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={googleSubmitting || loading}
          onClick={handleGoogleLogin}
        >
          {googleSubmitting ? "Redirecting..." : "Continue with Google"}
        </Button>
      </Form>
      <br />
      <p>
        No account yet? <AppLink href="/register">Register</AppLink>
      </p>
      <p>
        Forgot password? <AppLink href="/forgot-password">Reset it</AppLink>
      </p>
    </SectionContainer>
  );
}
