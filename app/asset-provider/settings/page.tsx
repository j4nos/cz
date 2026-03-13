"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Form, FormField, FormInput } from "@/components/ui/Form";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";

export default function AssetProviderSettingsPage() {
  const { user, profile, logout, accessToken } = useAuth();
  const router = useRouter();
  const { setToast } = useToast();
  const [companyName, setCompanyName] = useState(profile?.companyName ?? "");
  const [country, setCountry] = useState(profile?.country ?? "");

  useEffect(() => {
    setCompanyName(profile?.companyName ?? "");
    setCountry(profile?.country ?? "");
  }, [profile]);

  if (!user || !profile) {
    return <p className="muted">Login to edit settings.</p>;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await (await import("@/src/infrastructure/auth/createAuthClient"))
      .createAuthClient()
      .upsertUserProfile({
        uid: user.uid,
        email: profile.email,
        role: profile.role,
        country,
        companyName,
      });
    setToast("Setting saved", "success", 2000);
  }

  async function handleDeleteAccount() {
    if (!user) return;
    const confirmed = window.confirm(
      "Delete your account and profile? This cannot be undone."
    );
    if (!confirmed) return;
    try {
      if (!accessToken) {
        throw new Error("Missing access token.");
      }
      const response = await fetch("/api/account/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (!response.ok) {
        throw new Error("Delete failed.");
      }
      await logout();
      router.push("/");
      setToast("Account deleted.", "success", 2500);
    } catch (error) {
      setToast("Failed to delete account.", "danger", 2500);
    }
  }

  return (
    <div className="vertical-stack-with-gap">
      <header>
        <h1>Asset Provider Settings</h1>
      </header>
      <>
        <Form onSubmit={handleSubmit}>
          <FormField label="Company name" htmlFor="provider-company">
            <FormInput
              id="provider-company"
              value={companyName}
              onChange={(event) => setCompanyName(event.target.value)}
            />
          </FormField>
          <FormField label="Country" htmlFor="provider-country">
            <FormInput
              id="provider-country"
              value={country}
              onChange={(event) => setCountry(event.target.value)}
            />
          </FormField>
          <Button type="submit">Save</Button>
        </Form>
        <Button type="button" variant="ghost" onClick={handleDeleteAccount}>
          Delete account
        </Button>
      </>
    </div>
  );
}
