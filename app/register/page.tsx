"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { SectionContainer } from "@/components/sections/SectionContainer";
import { AppLink } from "@/components/ui/AppLink";
import { Button } from "@/components/ui/Button";
import { Form, FormField, FormInput } from "@/components/ui/Form";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";

export default function RegisterPage() {
  const router = useRouter();
  const { register, confirmRegistration, login, loading } = useAuth();
  const { setToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmationCode, setConfirmationCode] = useState("");
  const [codeEnabled, setCodeEnabled] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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
        await login(email, password);
        router.push("/");
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
      router.push("/");
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
