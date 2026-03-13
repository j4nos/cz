"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Popup } from "@/components/ui/Popup";

type WithdrawPopupProps = {
  open: boolean;
  onClose: () => void;
  onWithdraw: (wallet: string) => void;
  defaultWallet?: string;
};

export function WithdrawPopup({ open, onClose, onWithdraw, defaultWallet }: WithdrawPopupProps) {
  const [wallet, setWallet] = useState(defaultWallet || "");
  const [error, setError] = useState("");

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!wallet.trim()) {
      setError("Wallet address is required.");
      return;
    }

    setError("");
    onWithdraw(wallet.trim());
  }

  return (
    <Popup open={open} onClose={onClose} title="Withdraw in wallet">
      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: 16 }}
      >
        <label htmlFor="wallet">Wallet address</label>
        <input
          id="wallet"
          type="text"
          value={wallet}
          onChange={(e) => setWallet(e.target.value)}
          placeholder="0x..."
          style={{ padding: 8, borderRadius: 6, border: "1px solid #ccc" }}
        />
        {error && <span style={{ color: "#c00", fontSize: 13 }}>{error}</span>}
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <Button type="submit">Withdraw</Button>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </form>
    </Popup>
  );
}
