"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { generateClient } from "aws-amplify/data";

import { Button } from "@/components/ui/Button";
import { Form, FormField, FormInput } from "@/components/ui/Form";
import { useToast } from "@/contexts/ToastContext";
import type { Schema } from "@/amplify/data/resource";
import { ensureAmplifyConfigured } from "@/src/config/amplify";
import { useAuth } from "@/contexts/AuthContext";

export default function PlatformAdminHomepageCtaPage() {
  const { user, isAuthenticated, loading, isAdmin, accessToken } = useAuth();
  const client = useMemo(() => {
    ensureAmplifyConfigured();
    return generateClient<Schema>();
  }, []);
  const [firstAssetId, setFirstAssetId] = useState("");
  const [firstListingId, setFirstListingId] = useState("");
  const [secondAssetId, setSecondAssetId] = useState("");
  const [secondListingId, setSecondListingId] = useState("");
  const { setToast } = useToast();

  const loadSettings = useCallback(async () => {
    if (!isAuthenticated || !isAdmin) {
      return;
    }

    const { data } = await client.models.PlatformSettings.get(
      {
        id: "homepage",
      },
      { authMode: "userPool" },
    );
    setFirstAssetId(data?.homepageFirstAssetId ?? "");
    setFirstListingId(data?.homepageFirstListingId ?? "");
    setSecondAssetId(data?.homepageSecondAssetId ?? "");
    setSecondListingId(data?.homepageSecondListingId ?? "");
  }, [client, isAdmin, isAuthenticated]);

  useEffect(() => {
    if (!loading && isAuthenticated && isAdmin) {
      void loadSettings();
    }
  }, [isAdmin, isAuthenticated, loadSettings, loading]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      const existing = await client.models.PlatformSettings.get(
        {
          id: "homepage",
        },
        { authMode: "userPool" },
      );
      const payload = {
        id: "homepage",
        homepageFirstAssetId: firstAssetId,
        homepageFirstListingId: firstListingId,
        homepageSecondAssetId: secondAssetId,
        homepageSecondListingId: secondListingId,
        updatedByUserId: user?.uid ?? "",
        updatedAt: new Date().toISOString(),
      };

      const response = existing.data
        ? await client.models.PlatformSettings.update(payload, { authMode: "userPool" })
        : await client.models.PlatformSettings.create(payload, { authMode: "userPool" });

      if (!response.data) {
        throw new Error(response.errors?.[0]?.message || "Failed to save homepage CTA settings.");
      }

      await loadSettings();
      await fetch("/api/platform-admin/revalidate-homepage", {
        method: "POST",
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
      });

      setToast("Setting saved", "success", 2000);
    } catch (error) {
      console.error("save homepage CTA failed", error);
      const message =
        error instanceof Error ? error.message : "Failed to save homepage CTA settings.";
      setToast(message, "danger", 3000);
    }
  }

  if (loading) {
    return null;
  }

  if (!isAuthenticated) {
    return <p className="muted">Login to manage homepage CTA.</p>;
  }

  if (!isAdmin) {
    return <p className="muted">Only platform admins can access this page.</p>;
  }

  return (
    <div className="vertical-stack-with-gap">
      <header>
        <h1>Homepage CTA</h1>
        <p className="muted">Configure the two featured listing links.</p>
      </header>
      <>
        <Form onSubmit={handleSubmit}>
          <FormField label="First assetId" htmlFor="cta-first-asset">
            <FormInput
              id="cta-first-asset"
              value={firstAssetId}
              onChange={(event) => setFirstAssetId(event.target.value)}
              placeholder="asset id"
            />
          </FormField>
          <FormField label="First listingId" htmlFor="cta-first-listing">
            <FormInput
              id="cta-first-listing"
              value={firstListingId}
              onChange={(event) => setFirstListingId(event.target.value)}
              placeholder="listing id"
            />
          </FormField>
          <FormField label="Second assetId" htmlFor="cta-second-asset">
            <FormInput
              id="cta-second-asset"
              value={secondAssetId}
              onChange={(event) => setSecondAssetId(event.target.value)}
              placeholder="asset id"
            />
          </FormField>
          <FormField label="Second listingId" htmlFor="cta-second-listing">
            <FormInput
              id="cta-second-listing"
              value={secondListingId}
              onChange={(event) => setSecondListingId(event.target.value)}
              placeholder="listing id"
            />
          </FormField>
          <Button type="submit">Save</Button>
        </Form>
      </>
    </div>
  );
}
