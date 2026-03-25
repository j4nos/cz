"use client";

import { useEffect, useMemo, useState } from "react";
import { PlainCta } from "@/components/sections/PlainCta";
import { AppLink } from "@/components/ui/AppLink";
import { usePrivateAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/Badge";
import { Table } from "@/components/ui/Table";
import type { Asset } from "@/src/domain/entities";
import { createReadPort } from "@/src/presentation/composition/client";

export default function AssetProviderAssetsPage() {
  const { user } = usePrivateAuth();
  const readController = useMemo(() => createReadPort(), []);
  const [assets, setAssets] = useState<Asset[]>([]);

  useEffect(() => {
    async function load() {
      const nextAssets = await readController.listAssets();
      setAssets(nextAssets.filter((asset) => asset.tenantUserId === user.uid));
    }

    void load();
  }, [readController, user.uid]);

  return (
    <div className="vertical-stack-with-gap">
      <PlainCta
        title="Create a new asset"
        text="Start the onboarding wizard to add a property."
        actionLabel="Create asset"
        href="/asset-provider/assets/new/step-1?fresh=1"
      />
      <Table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {assets.map((asset) => (
            <tr key={asset.id}>
              <td>{asset.name}</td>
              <td>
                <Badge
                  color={
                    asset.status === "approved"
                      ? "success"
                      : asset.status === "submitted" ||
                        asset.status === "pending"
                      ? "info"
                      : asset.status === "closed"
                      ? "danger"
                      : "warning"
                  }
                >
                  {asset.status}
                </Badge>
              </td>
              <td>
                <AppLink
                  href={`/asset-provider/assets/${asset.id}`}
                  looksLikeButton
                >
                  Open
                </AppLink>
              </td>
            </tr>
          ))}
          {assets.length === 0 ? (
            <tr>
              <td colSpan={3}>No assets yet.</td>
            </tr>
          ) : null}
        </tbody>
      </Table>
    </div>
  );
}
