"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export interface AssetWizardState {
  assetId: string;
  name: string;
  country: string;
  assetClass: string;
  tokenStandard: string;
}

interface AssetWizardContextValue {
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
  tokenStandard: "ERC-20",
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
        tokenStandard:
          parsed.tokenStandard === "ERC-20" || parsed.tokenStandard === "ERC-721"
            ? parsed.tokenStandard
            : defaultState.tokenStandard,
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
      state,
      updateState: (patch) => setState((current) => ({ ...current, ...patch })),
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
