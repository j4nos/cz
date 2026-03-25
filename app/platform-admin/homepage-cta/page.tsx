"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Form, FormField, FormInput } from "@/components/ui/Form";
import { useToast } from "@/contexts/ToastContext";
import { usePrivateAuth } from "@/contexts/AuthContext";
import { createHomepageSettingsFacade } from "@/src/presentation/composition/client";

export default function PlatformAdminHomepageCtaPage() {
  const { user, accessToken } = usePrivateAuth();
  const homepageSettings = useMemo(() => createHomepageSettingsFacade(), []);
  const [firstAssetId, setFirstAssetId] = useState("");
  const [firstListingId, setFirstListingId] = useState("");
  const [secondAssetId, setSecondAssetId] = useState("");
  const [secondListingId, setSecondListingId] = useState("");
  const { setToast } = useToast();

  const loadSettings = useCallback(async () => {
    const data = await homepageSettings.load();
    setFirstAssetId(data.firstAssetId);
    setFirstListingId(data.firstListingId);
    setSecondAssetId(data.secondAssetId);
    setSecondListingId(data.secondListingId);
  }, [homepageSettings]);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      await homepageSettings.save({
        firstAssetId,
        firstListingId,
        secondAssetId,
        secondListingId,
        updatedByUserId: user?.uid ?? "",
        accessToken,
      });
      await loadSettings();

      setToast("Setting saved", "success", 2000);
    } catch (error) {
      console.error("save homepage CTA failed", error);
      const message =
        error instanceof Error ? error.message : "Failed to save homepage CTA settings.";
      setToast(message, "danger", 3000);
    }
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
