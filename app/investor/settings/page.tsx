"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Form, FormField, FormInput, FormSelect } from "@/components/ui/Form";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { AccountSettingsService } from "@/src/application/use-cases/accountSettingsService";
import { createAuthClient } from "@/src/infrastructure/auth/createAuthClient";

export default function InvestorSettingsPage() {
  const { user, profile, logout, accessToken } = useAuth();
  const router = useRouter();
  const { setToast } = useToast();
  const accountSettingsService = useMemo(
    () =>
      new AccountSettingsService(
        createAuthClient(),
        async (currentAccessToken) => {
          const response = await fetch("/api/account/delete", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${currentAccessToken}`,
            },
          });
          if (!response.ok) {
            throw new Error("Delete failed.");
          }
        },
      ),
    [],
  );
  const [country, setCountry] = useState(profile?.country ?? "");
  const [investorType, setInvestorType] = useState(
    profile?.investorType ?? "retail"
  );
  const [companyName, setCompanyName] = useState(profile?.companyName ?? "");

  useEffect(() => {
    setCountry(profile?.country ?? "");
    setInvestorType(profile?.investorType ?? "retail");
    setCompanyName(profile?.companyName ?? "");
  }, [profile]);

  if (!user || !profile) {
    return <p className="muted">Login to manage settings.</p>;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const result = await accountSettingsService.saveInvestorSettings({
        user,
        profile,
        country,
        investorType,
        companyName,
      });
      setToast(result.message, result.kind === "success" ? "success" : "danger", 2000);
    } catch {
      setToast("Failed to save settings.", "danger", 2000);
    }
  }

  async function handleDeleteAccount() {
    if (!user) return;
    const confirmed = window.confirm(
      "Delete your account and profile? This cannot be undone."
    );
    if (!confirmed) return;
    try {
      const result = await accountSettingsService.deleteAccount(accessToken);
      if (result.kind === "error") {
        setToast(result.message, "danger", 2500);
        return;
      }
      await logout();
      router.push("/");
      setToast(result.message, "success", 2500);
    } catch {
      setToast("Failed to delete account.", "danger", 2500);
    }
  }

  return (
    <div className="vertical-stack-with-gap">
      <header>
        <h1>Investor Settings</h1>
        <p className="muted">Update your profile and investor type.</p>
      </header>
      <>
        <Form onSubmit={handleSubmit}>
          <FormField label="Country" htmlFor="settings-country">
            <FormInput
              id="settings-country"
              value={country}
              onChange={(event) => setCountry(event.target.value)}
            />
          </FormField>
          <FormField label="Investor type" htmlFor="settings-investor-type">
            <FormSelect
              id="settings-investor-type"
              value={investorType}
              options={[
                { value: "retail", label: "Retail" },
                { value: "accredited", label: "Accredited" },
              ]}
              onChange={(event) => setInvestorType(event.target.value)}
            />
          </FormField>
          <FormField label="Company name" htmlFor="settings-company">
            <FormInput
              id="settings-company"
              value={companyName}
              onChange={(event) => setCompanyName(event.target.value)}
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
