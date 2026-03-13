"use client";

import { useEffect, useState } from "react";
import { PlainCta } from "@/components/sections/PlainCta";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/contexts/AuthContext";
import pageStyles from "./page.module.css";

export default function InvestorKycPage() {
  const { user, profile } = useAuth();
  const [kycStatus, setKycStatus] = useState(profile?.kycStatus ?? "not-started");
  const placeholderId = "kyc-embed-placeholder";

  useEffect(() => {
    setKycStatus(profile?.kycStatus ?? "not-started");
  }, [profile]);

  if (!user || !profile) {
    return <p className="muted">Login to manage KYC.</p>;
  }

  return (
    <div className="vertical-stack-with-gap">
      <PlainCta
        title="Start KYC"
        text="Begin verification to unlock investing."
        actionLabel="Start KYC"
        href={`#${placeholderId}`}
      />
      <header>
        <div className="horizontal-stack">
          <span className="muted">Status</span>
          <Badge
            color={
              kycStatus === "approved"
                ? "success"
                : kycStatus === "rejected"
                ? "danger"
                : kycStatus === "submitted"
                ? "info"
                : "warning"
            }
          >
            {kycStatus || "pending"}
          </Badge>
        </div>
      </header>
      <>
        <div
          className={pageStyles.embedPlaceholder}
          id={placeholderId}
          aria-label="KYC iframe placeholder"
        >
          <span className="muted">KYC provider iframe placeholder image</span>
        </div>
      </>
    </div>
  );
}
