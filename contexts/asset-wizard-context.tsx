"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type TokenStandard = "ERC-20" | "ERC-721";

export interface AssetWizardState {
  assetId: string;
  name: string;
  country: string;
  assetClass: string;
  beneficiaryIban: string;
  beneficiaryLabel: string;
  tokenName: string;
  tokenStandard: TokenStandard;
  tokenAddress: string;
}

interface AssetWizardContextValue {
  assetId: string | null;
  assetName: string | null;
  country: string | null;
  assetClass: string | null;
  beneficiaryIban: string | null;
  beneficiaryLabel: string | null;
  tokenName: string | null;
  tokenStandard: TokenStandard | null;
  tokenAddress: string | null;
  setAssetId: (value: string | null) => void;
  setAssetName: (value: string | null) => void;
  setCountry: (value: string | null) => void;
  setAssetClass: (value: string | null) => void;
  setBeneficiaryIban: (value: string | null) => void;
  setBeneficiaryLabel: (value: string | null) => void;
  setTokenName: (value: string | null) => void;
  setTokenStandard: (value: TokenStandard | null) => void;
  setTokenAddress: (value: string | null) => void;
  state: AssetWizardState;
  updateState: (patch: Partial<AssetWizardState>) => void;
  resetState: () => void;
}

const STORAGE_KEY = "cityzeen.asset-wizard";

const defaultState: AssetWizardState = {
  assetId: "",
  name: "",
  country: "",
  assetClass: "REAL_ESTATE",
  beneficiaryIban: "",
  beneficiaryLabel: "",
  tokenName: "",
  tokenStandard: "ERC-20",
  tokenAddress: "",
};

const AssetWizardContext = createContext<AssetWizardContextValue | null>(null);

export function AssetWizardProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AssetWizardState>(defaultState);

  useEffect(() => {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as AssetWizardState;
      setState({
        ...defaultState,
        ...parsed,
        beneficiaryIban: parsed.beneficiaryIban ?? defaultState.beneficiaryIban,
        beneficiaryLabel: parsed.beneficiaryLabel ?? defaultState.beneficiaryLabel,
        tokenName: parsed.tokenName ?? defaultState.tokenName,
        tokenStandard:
          parsed.tokenStandard === "ERC-20" || parsed.tokenStandard === "ERC-721"
            ? parsed.tokenStandard
            : defaultState.tokenStandard,
        tokenAddress: parsed.tokenAddress ?? defaultState.tokenAddress,
      });
    } catch {
      window.sessionStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const value = useMemo<AssetWizardContextValue>(
    () => ({
      assetId: state.assetId || null,
      assetName: state.name || null,
      country: state.country || null,
      assetClass: state.assetClass || null,
      beneficiaryIban: state.beneficiaryIban || null,
      beneficiaryLabel: state.beneficiaryLabel || null,
      tokenName: state.tokenName || null,
      tokenStandard: state.tokenStandard || null,
      tokenAddress: state.tokenAddress || null,
      setAssetId: (value) =>
        setState((current) => ({ ...current, assetId: value ?? "" })),
      setAssetName: (value) =>
        setState((current) => ({ ...current, name: value ?? "" })),
      setCountry: (value) =>
        setState((current) => ({ ...current, country: value ?? "" })),
      setAssetClass: (value) =>
        setState((current) => ({
          ...current,
          assetClass: value ?? defaultState.assetClass,
        })),
      setBeneficiaryIban: (value) =>
        setState((current) => ({ ...current, beneficiaryIban: value ?? "" })),
      setBeneficiaryLabel: (value) =>
        setState((current) => ({ ...current, beneficiaryLabel: value ?? "" })),
      setTokenName: (value) =>
        setState((current) => ({ ...current, tokenName: value ?? "" })),
      setTokenStandard: (value) =>
        setState((current) => ({
          ...current,
          tokenStandard: value ?? defaultState.tokenStandard,
        })),
      setTokenAddress: (value) =>
        setState((current) => ({ ...current, tokenAddress: value ?? "" })),
      state,
      updateState: (patch) =>
        setState((current) => ({
          ...current,
          ...patch,
          name: patch.name ?? current.name,
          country: patch.country ?? current.country,
          assetClass: patch.assetClass ?? current.assetClass,
          beneficiaryIban: patch.beneficiaryIban ?? current.beneficiaryIban,
          beneficiaryLabel:
            patch.beneficiaryLabel ?? current.beneficiaryLabel,
          tokenName: patch.tokenName ?? current.tokenName,
          tokenStandard: patch.tokenStandard ?? current.tokenStandard,
          tokenAddress: patch.tokenAddress ?? current.tokenAddress,
        })),
      resetState: () => {
        setState(defaultState);
        window.sessionStorage.removeItem(STORAGE_KEY);
      },
    }),
    [state],
  );

  return <AssetWizardContext.Provider value={value}>{children}</AssetWizardContext.Provider>;
}

export function useAssetWizard() {
  const value = useContext(AssetWizardContext);
  if (!value) {
    throw new Error("useAssetWizard must be used within AssetWizardProvider.");
  }

  return value;
}
