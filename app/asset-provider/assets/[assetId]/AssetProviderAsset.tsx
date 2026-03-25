"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { PlainCta } from "@/components/sections/PlainCta";
import { AppLink } from "@/components/ui/AppLink";
import { Button } from "@/components/ui/Button";
import { Carousel } from "@/components/ui/Carousel";
import { Form, FormField, FormInput } from "@/components/ui/Form";
import { Table } from "@/components/ui/Table";
import { useAuth } from "@/contexts/AuthContext";
import { useLoading } from "@/contexts/LoadingContext";
import { useToast } from "@/contexts/ToastContext";
import {
  buildUpdatedAssetBasics,
} from "@/src/application/use-cases/assetUpdateAssembler";
import type { Asset, Listing } from "@/src/domain/entities";
import {
  createAssetPort,
  createReadPort,
  revalidateListingEntries,
  uploadAssetPhotos,
} from "@/src/presentation/composition/client";

type AssetView = Asset & {
  documents?: Array<{ id: string; name: string }>;
};

type Props = {
  assetId: string;
};

export function AssetProviderAsset({ assetId }: Props) {
  const router = useRouter();
  const { accessToken } = useAuth();
  const { setLoading } = useLoading();
  const { setToast } = useToast();
  const readController = useMemo(() => createReadPort(), []);
  const assetController = useMemo(() => createAssetPort(), []);
  const [asset, setAsset] = useState<AssetView | null | undefined>(undefined);
  const [assetListings, setAssetListings] = useState<Listing[]>([]);
  const [photos, setPhotos] = useState<File[]>([]);
  const [name, setName] = useState("");
  const [countryValue, setCountryValue] = useState("");
  const [assetClassValue, setAssetClassValue] = useState("");
  const [beneficiaryIban, setBeneficiaryIban] = useState("");
  const [beneficiaryLabel, setBeneficiaryLabel] = useState("");
  const [savingBasics, setSavingBasics] = useState(false);
  const [deletingAsset, setDeletingAsset] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading("asset-provider-asset", true);
      try {
        const [nextAsset, nextListings] = await Promise.all([
          readController.getAssetById(assetId),
          readController.listListingsByAssetId(assetId),
        ]);
        setAsset(nextAsset as AssetView | null);
        if (nextAsset) {
          setName(nextAsset.name ?? "");
          setCountryValue(nextAsset.country ?? "");
          setAssetClassValue(nextAsset.assetClass ?? "");
          setBeneficiaryIban(nextAsset.beneficiaryIban ?? "");
          setBeneficiaryLabel(nextAsset.beneficiaryLabel ?? "");
        }
        setAssetListings(nextListings);
      } finally {
        setLoading("asset-provider-asset", false);
      }
    }

    void load();
  }, [assetId, readController, setLoading]);

  async function uploadPhoto(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!asset || !photos.length) {
      return;
    }

    setUploadingPhoto(true);
    try {
      setLoading("asset-provider-asset-upload-photo", true);
      const updatedAsset = await uploadAssetPhotos({ asset, files: photos });
      setAsset(updatedAsset);
      setPhotos([]);
      setToast("Photo uploaded.", "success", 2500);
    } catch {
      setToast("Failed to upload photo.", "danger", 2500);
    } finally {
      setUploadingPhoto(false);
      setLoading("asset-provider-asset-upload-photo", false);
    }
  }

  if (asset === undefined) {
    return null;
  }

  if (!asset) {
    return null;
  }

  async function saveBasics(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!asset) {
      return;
    }

    setSavingBasics(true);
    try {
      setLoading("asset-provider-asset-save", true);
      const updated = await assetController.updateAsset(
        buildUpdatedAssetBasics({
          asset,
          name,
          country: countryValue,
          assetClass: assetClassValue,
          beneficiaryIban,
          beneficiaryLabel,
        })
      );
      setAsset(updated as AssetView);
      await revalidateListingEntries({
        accessToken,
        listingIds: assetListings.map((listing) => listing.id),
      });
      setToast("Asset basics updated.", "success");
    } catch {
      setToast("Failed to update asset basics.", "danger");
    } finally {
      setSavingBasics(false);
      setLoading("asset-provider-asset-save", false);
    }
  }

  async function handleDeleteAsset() {
    if (!asset) {
      return;
    }

    const confirmed = window.confirm("Delete this asset and all related listings?");
    if (!confirmed) {
      return;
    }

    setDeletingAsset(true);
    try {
      setLoading("asset-provider-asset-delete", true);
      await assetController.deleteAsset(asset.id);
      setToast("Asset deleted.", "success");
      router.push("/asset-provider/assets");
    } catch {
      setToast("Failed to delete asset.", "danger");
    } finally {
      setDeletingAsset(false);
      setLoading("asset-provider-asset-delete", false);
    }
  }

  return (
    <div className="vertical-stack-with-gap">
      {asset.tokenAddress ? (
        <PlainCta
          title="Asset contract address"
          text={`Address: ${asset.tokenAddress}\nStandard: ${(
            asset.tokenStandard ?? "ERC-20"
          ).toUpperCase()}`}
          actionLabel="View on Polygonscan"
          href={`https://polygonscan.com/address/${asset.tokenAddress}`}
        />
      ) : (
        <p className="muted">No token deployed yet.</p>
      )}

      <h2>Edit asset basics</h2>
      <Form onSubmit={saveBasics}>
        <FormField label="Name" htmlFor="asset-edit-name">
          <FormInput
            id="asset-edit-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </FormField>
        <FormField label="Country" htmlFor="asset-edit-country">
          <FormInput
            id="asset-edit-country"
            value={countryValue}
            onChange={(event) => setCountryValue(event.target.value)}
          />
        </FormField>
        <FormField label="Asset class" htmlFor="asset-edit-class">
          <FormInput
            id="asset-edit-class"
            value={assetClassValue}
            onChange={(event) => setAssetClassValue(event.target.value)}
          />
        </FormField>
        <FormField label="Beneficiary IBAN" htmlFor="asset-edit-iban">
          <FormInput
            id="asset-edit-iban"
            value={beneficiaryIban}
            onChange={(event) => setBeneficiaryIban(event.target.value)}
            placeholder="IBAN"
          />
        </FormField>
        <FormField label="Beneficiary label" htmlFor="asset-edit-label">
          <FormInput
            id="asset-edit-label"
            value={beneficiaryLabel}
            onChange={(event) => setBeneficiaryLabel(event.target.value)}
            placeholder="Beneficiary name"
          />
        </FormField>
        <Button type="submit" disabled={!asset || savingBasics}>
          {savingBasics ? "Saving..." : "Save changes"}
        </Button>
      </Form>

      <PlainCta
        title="Start listing creation"
        text="Create a new listing for this asset to begin the offering flow."
        actionLabel="Create listing"
        href={`/asset-provider/assets/${asset.id}/create`}
      />

      <h2>Listings</h2>
      <Table>
        <thead>
          <tr>
            <th>Title</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {assetListings.length === 0 ? (
            <tr>
              <td colSpan={3}>No listings yet.</td>
            </tr>
          ) : (
            assetListings.map((listing) => (
              <tr key={listing.id}>
                <td>{listing.title}</td>
                <td>{listing.saleStatus}</td>
                <td>
                  <AppLink
                    href={`/asset-provider/assets/${asset.id}/listings/${listing.id}/edit`}
                    looksLikeButton
                  >
                    Details
                  </AppLink>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </Table>

      <h2>Upload photo</h2>
      <Form onSubmit={uploadPhoto}>
        <FormField label="Image" htmlFor="asset-photo-upload">
          <FormInput
            id="asset-photo-upload"
            type="file"
            accept="image/*"
            multiple
            onChange={(event) =>
              setPhotos(Array.from(event.target.files ?? []))
            }
          />
        </FormField>
        <Button type="submit" disabled={!photos.length}>
          {uploadingPhoto ? "Uploading..." : "Upload"}
        </Button>
      </Form>

      <h2>Photos</h2>
      {asset.imageUrls.length > 0 ? (
        <Carousel images={asset.imageUrls} />
      ) : (
        <p className="muted">No photos uploaded for this asset yet.</p>
      )}

      <div className="button-group">
        <Button
          type="button"
          onClick={handleDeleteAsset}
          disabled={deletingAsset}
        >
          {deletingAsset ? "Deleting..." : "Delete asset"}
        </Button>
      </div>
    </div>
  );
}
