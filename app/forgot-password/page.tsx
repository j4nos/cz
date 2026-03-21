"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { SectionContainer } from "@/components/sections/SectionContainer";
import { AppLink } from "@/components/ui/AppLink";
import { Button } from "@/components/ui/Button";
import { Form, FormField, FormInput } from "@/components/ui/Form";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";

import styles from "./page.module.css";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { requestPasswordReset, confirmPasswordReset, loading } = useAuth();
  const { setToast } = useToast();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [step, setStep] = useState<"request" | "confirm">("request");
  const [submitting, setSubmitting] = useState(false);

  async function handleRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    try {
      await requestPasswordReset(email);
      setStep("confirm");
      setToast("We sent a reset code to your email.", "success", 3000);
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
        (err instanceof Error ? err.message : "Reset request failed");
      setToast(message, "danger", 2500);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    try {
      await confirmPasswordReset(email, code.trim(), newPassword);
      setToast("Password updated. Please login.", "success", 3000);
      router.push("/login");
    } catch (err) {
      const errorMessage =
        err &&
        typeof err === "object" &&
        "message" in err &&
        typeof err.message === "string"
          ? err.message
          : null;
      const message =
        errorMessage ?? (err instanceof Error ? err.message : "Reset failed");
      setToast(message, "danger", 2500);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SectionContainer className={styles.page}>
      <h1>Reset password</h1>
      <br />
      {step === "request" ? (
        <Form onSubmit={handleRequest} autoComplete="on">
          <FormField label="Email" htmlFor="reset-email">
            <FormInput
              id="reset-email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </FormField>
          <Button type="submit" disabled={submitting || loading}>
            {submitting ? "Sending..." : "Send reset code"}
          </Button>
        </Form>
      ) : (
        <Form onSubmit={handleConfirm} autoComplete="off">
          <FormField label="Email" htmlFor="reset-email-confirm">
            <FormInput
              id="reset-email-confirm"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </FormField>
          <FormField label="Reset code" htmlFor="reset-code">
            <FormInput
              id="reset-code"
              name="reset-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              required
            />
          </FormField>
          <FormField label="New password" htmlFor="reset-password">
            <FormInput
              id="reset-password"
              name="new-password"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              required
            />
          </FormField>
          <Button type="submit" disabled={submitting || loading}>
            {submitting ? "Updating..." : "Update password"}
          </Button>
        </Form>
      )}
      <br />
      <p>
        Back to <AppLink href="/login">Login</AppLink>
      </p>
    </SectionContainer>
  );
}
