"use client";

import { useEffect, useMemo, useState } from "react";
import { unstable_batchedUpdates } from "react-dom";

import { WithdrawPopup } from "@/components/WithdrawPopup";
import { Button } from "@/components/ui/Button";
import { Table } from "@/components/ui/Table";
import { OwnershipMintingService } from "@/src/application/use-cases/ownershipMintingService";
import { useAuth } from "@/contexts/AuthContext";
import { useLoading } from "@/contexts/LoadingContext";
import { useToast } from "@/contexts/ToastContext";
import type { Order } from "@/src/domain/entities";
import { createReadController } from "@/src/infrastructure/controllers/createReadController";

export default function InvestorPortfolioPage() {
  const { activeUser, accessToken, loading } = useAuth();
  const { setToast } = useToast();
  const { setLoading } = useLoading();
  const readController = useMemo(() => createReadController(), []);
  const ownershipMintingService = useMemo(
    () =>
      new OwnershipMintingService(
        readController,
        async ({ accessToken: currentAccessToken, body }) => {
          const response = await fetch("/api/mint-ownership", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${currentAccessToken}`,
            },
            body: JSON.stringify(body),
          });
          const result = await response.json().catch(() => ({}));
          if (!response.ok) {
            throw new Error(result?.error || "Mint API error");
          }
          return result;
        },
      ),
    [readController],
  );
  const [orders, setOrders] = useState<Order[]>([]);
  const [tokenHoldings, setTokenHoldings] = useState<
    Array<{
      orderId: string;
      tokenAddress: string;
      assetId: string;
      listingId: string;
      quantity: number;
      createdAt?: string;
    }>
  >([]);
  const [tokenAddressByListingId, setTokenAddressByListingId] = useState<Record<string, string>>({});
  const [withdrawOrderId, setWithdrawOrderId] = useState<string | null>(null);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawDefaultWallet, setWithdrawDefaultWallet] = useState("");

  function formatDate(value?: string) {
    if (!value) {
      return "\u2013";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "\u2013";
    }

    return date.toLocaleString();
  }

  useEffect(() => {
    async function load() {
      setLoading("investor-portfolio", true);

      if (!activeUser) {
        unstable_batchedUpdates(() => {
          setOrders([]);
          setTokenHoldings([]);
          setTokenAddressByListingId({});
        });
        setLoading("investor-portfolio", false);
        return;
      }

      try {
        const next = (await readController.listOrdersByInvestor(activeUser.uid)).filter(
          (order) => order.status === "paid",
        );

        next.sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime());

        const eligibleOrders = next.filter(
          (order) => order.investorWalletAddress || order.withdrawnAt || order.mintedAt,
        );
        const listingIds = Array.from(new Set(eligibleOrders.map((order) => order.listingId).filter(Boolean)));
        const listings = await Promise.all(listingIds.map((listingId) => readController.getListingById(listingId)));
        const listingById = new Map(
          listings
            .filter((listing): listing is NonNullable<typeof listing> => Boolean(listing))
            .map((listing) => [listing.id, listing]),
        );
        const assetIds = Array.from(new Set(listings.map((listing) => listing?.assetId).filter(Boolean)));
        const assets = await Promise.all(assetIds.map((assetId) => readController.getAssetById(assetId as string)));
        const assetById = new Map(
          assets.filter((asset): asset is NonNullable<typeof asset> => Boolean(asset)).map((asset) => [asset.id, asset]),
        );

        const tokens: Array<{
          orderId: string;
          tokenAddress: string;
          assetId: string;
          listingId: string;
          quantity: number;
          createdAt?: string;
        }> = [];
        const tokenMap: Record<string, string> = {};

        for (const order of eligibleOrders) {
          const listing = listingById.get(order.listingId);
          if (!listing) {
            continue;
          }

          const asset = assetById.get(listing.assetId);
          const resolvedToken = asset?.tokenAddress;
          if (!resolvedToken) {
            continue;
          }

          tokens.push({
            orderId: order.id,
            tokenAddress: resolvedToken,
            assetId: listing.assetId,
            listingId: order.listingId,
            quantity: order.quantity,
            createdAt: order.mintedAt ?? order.withdrawnAt ?? order.createdAt,
          });
          tokenMap[order.listingId] = resolvedToken;
        }

        tokens.sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime());

        unstable_batchedUpdates(() => {
          setOrders(next);
          setTokenHoldings(tokens);
          setTokenAddressByListingId(tokenMap);
        });
      } finally {
        setLoading("investor-portfolio", false);
      }
    }

    void load();
  }, [activeUser, readController, setLoading]);

  if (loading) {
    return null;
  }

  if (!activeUser) {
    return <p className="muted">Login to view your portfolio.</p>;
  }

  function openWithdraw(orderId: string) {
    const order = orders.find((item) => item.id === orderId);
    setWithdrawDefaultWallet(order?.investorWalletAddress || "");
    setWithdrawOrderId(orderId);
  }

  async function handleWithdraw(walletAddress: string) {
    if (!withdrawOrderId) {
      return;
    }

    const order = orders.find((item) => item.id === withdrawOrderId);

    setWithdrawLoading(true);
    try {
      const result = await ownershipMintingService.mint({
        order: order ?? null,
        walletAddress,
        accessToken,
        knownTokenAddress: tokenAddressByListingId[order?.listingId ?? ""],
      });
      if (result.kind === "error") {
        setToast(result.message, "danger", 2500);
        return;
      }

      const nextMintRequestedAt =
        typeof result.result.mintRequestedAt === "string" ? result.result.mintRequestedAt : null;
      const nextMintedAt =
        typeof result.result.mintedAt === "string" ? result.result.mintedAt : null;

      if (result.result.status === "minted" || nextMintedAt) {
        setOrders((current) =>
          current.map((item) =>
            item.id === withdrawOrderId
              ? {
                  ...item,
                  investorWalletAddress: walletAddress.trim(),
                  mintRequestedAt: nextMintRequestedAt ?? item.mintRequestedAt,
                  mintedAt: nextMintedAt ?? item.mintedAt,
                }
              : item,
          ),
        );
      } else {
        setOrders((current) =>
          current.map((item) =>
            item.id === withdrawOrderId
              ? {
                  ...item,
                  investorWalletAddress: walletAddress.trim(),
                  mintRequestedAt: nextMintRequestedAt ?? item.mintRequestedAt,
                  mintedAt: nextMintedAt ?? item.mintedAt,
                }
              : item,
          ),
        );
      }

      if (order?.listingId && result.tokenAddress) {
        setTokenAddressByListingId((current) => ({
          ...current,
          [order.listingId]: result.tokenAddress,
        }));
      }

      const resolvedAssetId = result.listing?.assetId ?? "";
      setTokenHoldings((current) => {
        const exists = current.find((item) => item.orderId === order?.id);
        const nextEntry = {
          orderId: order?.id ?? "",
          tokenAddress: result.tokenAddress,
          assetId: resolvedAssetId,
          listingId: order?.listingId ?? "",
          quantity: order?.quantity ?? 0,
        };
        if (exists) {
          return current.map((item) => (item.orderId === order?.id ? nextEntry : item));
        }
        return [...current, nextEntry];
      });

      setToast(
        result.toast.message,
        result.toast.tone,
        result.toast.tone === "warning" ? 3500 : 4000,
      );
      setWithdrawOrderId(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Withdraw failed.";
      setToast(message, "danger", 3500);
      console.error("withdraw error", error);
    } finally {
      setWithdrawLoading(false);
    }
  }

  return (
    <div className="vertical-stack-with-gap">
      <header>
        <h1>Portfolio</h1>
        <p className="muted">Paid investments summary.</p>
      </header>
      <h2>Paid orders</h2>
      <Table>
        <thead>
          <tr>
            <th>Order</th>
            <th>Product</th>
            <th>Qty</th>
            <th>Total</th>
            <th>Created</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td style={{ wordBreak: "break-all" }}>{order.id}</td>
              <td>{order.productName ?? order.productId}</td>
              <td>{order.quantity}</td>
              <td>
                {order.currency} {order.total}
              </td>
              <td className="muted">{formatDate(order.createdAt)}</td>
              <td>
                {order.mintedAt ? (
                  <span className="muted">Minted</span>
                ) : order.mintRequestedAt ? (
                  <span className="muted">Minting queued</span>
                ) : order.withdrawnAt ? (
                  <span className="muted">Withdrawn</span>
                ) : (
                  <Button onClick={() => openWithdraw(order.id)} disabled={withdrawLoading}>
                    Withdraw in wallet
                  </Button>
                )}
              </td>
            </tr>
          ))}
          {orders.length === 0 ? (
            <tr>
              <td colSpan={6}>No paid investments yet.</td>
            </tr>
          ) : null}
        </tbody>
      </Table>
      <WithdrawPopup
        open={!!withdrawOrderId}
        onClose={() => setWithdrawOrderId(null)}
        onWithdraw={handleWithdraw}
        defaultWallet={withdrawDefaultWallet}
      />
      <h2>Tokenized assets</h2>
      <Table>
        <thead>
          <tr>
            <th>Order</th>
            <th>Token</th>
            <th>Asset</th>
            <th>Qty</th>
            <th>Contract</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          {tokenHoldings.map((item, index) => {
            const contractUrl = `https://polygonscan.com/address/${item.tokenAddress}`;
            return (
              <tr key={`${item.orderId}-${item.tokenAddress}-${index}`}>
                <td style={{ wordBreak: "break-all" }}>{item.orderId || "\u2014"}</td>
                <td style={{ wordBreak: "break-all" }}>{item.tokenAddress || "\u2014"}</td>
                <td style={{ wordBreak: "break-all" }}>{item.assetId || "\u2014"}</td>
                <td>{Number.isFinite(item.quantity) ? item.quantity : "\u2014"}</td>
                <td style={{ whiteSpace: "nowrap" }}>
                  <a href={contractUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#9DAD7F" }}>
                    Contract
                  </a>
                </td>
                <td className="muted">{formatDate(item.createdAt)}</td>
              </tr>
            );
          })}
          {tokenHoldings.length === 0 ? (
            <tr>
              <td colSpan={6}>No tokenized positions detected yet.</td>
            </tr>
          ) : null}
        </tbody>
      </Table>
    </div>
  );
}
