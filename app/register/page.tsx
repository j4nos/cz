"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { SectionContainer } from "@/components/sections/SectionContainer";
import { AppLink } from "@/components/ui/AppLink";
import { Button } from "@/components/ui/Button";
import { Form, FormField, FormInput } from "@/components/ui/Form";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterContent />
    </Suspense>
  );
}

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register, confirmRegistration, signInWithGoogle, loading, isAuthenticated } = useAuth();
  const { setToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmationCode, setConfirmationCode] = useState("");
  const [codeEnabled, setCodeEnabled] = useState(false);
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
      if (codeEnabled) {
        if (!confirmationCode.trim()) {
          setToast(
            "Enter the confirmation code from your email.",
            "danger",
            2500,
          );
          return;
        }
        await confirmRegistration({
          email,
          password,
          code: confirmationCode.trim(),
          role: "INVESTOR",
          country: "HU",
        });
        router.push(nextHref);
        return;
      }

      const result = await register({
        email,
        password,
        role: "INVESTOR",
        country: "HU",
      });
      if (result.needsConfirmation) {
        setCodeEnabled(true);
        setToast("Enter the confirmation code from your email.", "success", 3000);
        return;
      }
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
        errorMessage ??
        (err instanceof Error ? err.message : "Registration failed");
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
    <SectionContainer>
      <h1>Registration</h1>
      <br />
      <Form onSubmit={handleSubmit} autoComplete="on">
        <FormField label="Email" htmlFor="register-email">
          <FormInput
            id="register-email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </FormField>
        <FormField label="Password" htmlFor="register-password">
          <FormInput
            id="register-password"
            name="new-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </FormField>
        {codeEnabled ? (
          <FormField label="Confirmation code" htmlFor="register-code">
            <FormInput
              id="register-code"
              name="confirmation-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              value={confirmationCode}
              onChange={(event) => setConfirmationCode(event.target.value)}
            />
          </FormField>
        ) : null}
        <Button type="submit" disabled={submitting || loading}>
          {submitting ? "Creating..." : "Register"}
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
        Already have an account? <AppLink href="/login">Login</AppLink>
      </p>
      <p>
        Forgot password? <AppLink href="/forgot-password">Reset it</AppLink>
      </p>
    </SectionContainer>
  );
}
