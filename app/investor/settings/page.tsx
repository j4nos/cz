"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Form, FormField, FormInput, FormSelect } from "@/components/ui/Form";
import { usePrivateAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import type { InvestorType } from "@/src/domain/entities";
import { createAccountSettingsService } from "@/src/presentation/composition/client";

export default function InvestorSettingsPage() {
  const { user, profile, logout, accessToken } = usePrivateAuth();
  const router = useRouter();
  const { setToast } = useToast();
  const accountSettingsService = useMemo(() => createAccountSettingsService(), []);
  const [country, setCountry] = useState(profile?.country ?? "");
  const [investorType, setInvestorType] = useState<InvestorType>(
    profile?.investorType ?? "RETAIL"
  );
  const [companyName, setCompanyName] = useState(profile?.companyName ?? "");

  useEffect(() => {
    setCountry(profile?.country ?? "");
    setInvestorType(profile?.investorType ?? "RETAIL");
    setCompanyName(profile?.companyName ?? "");
  }, [profile]);

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
                { value: "RETAIL", label: "Retail" },
                { value: "PROFESSIONAL", label: "Professional" },
              ]}
              onChange={(event) => setInvestorType(event.target.value as InvestorType)}
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
