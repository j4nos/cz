"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

import type { AuthUser } from "@/src/application/interfaces/authClient";
import type { UserProfile } from "@/src/domain/entities";
import { createAuthClient } from "@/src/infrastructure/auth/createAuthClient";

type AuthContextValue = {
  user: AuthUser | null;
  activeUser: AuthUser | null;
  getActiveUser: () => AuthUser | null;
  accessToken: string | null;
  getAccessToken: () => string | null;
  profile: UserProfile | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<UserProfile | null>;
  register: (input: {
    email: string;
    password: string;
    role: UserProfile["role"];
    country?: string;
  }) => Promise<{ needsConfirmation: boolean; profile: UserProfile | null }>;
  confirmRegistration: (input: {
    email: string;
    password: string;
    code: string;
    role: UserProfile["role"];
    country?: string;
  }) => Promise<UserProfile | null>;
  resendConfirmationCode: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const authClient = useMemo(() => createAuthClient(), []);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadProfile(nextUser: AuthUser | null) {
    if (!nextUser) {
      setProfile(null);
      return;
    }

    const nextProfile = await authClient.getUserProfile(nextUser.uid);
    setProfile(nextProfile);
  }

  async function refreshSessionState(nextUser: AuthUser | null) {
    setUser(nextUser);
    await loadProfile(nextUser);
    setAccessToken(await authClient.getAccessToken());
  }

  useEffect(() => {
    let active = true;

    const unsubscribe = authClient.onAuthStateChanged((nextUser) => {
      void (async () => {
        if (!active) {
          return;
        }

        setLoading(true);
        try {
          await refreshSessionState(nextUser);
        } catch (nextError) {
          setUser(null);
          setProfile(null);
          setAccessToken(null);
          setError(nextError instanceof Error ? nextError.message : "Failed to initialize auth.");
        } finally {
          if (active) {
            setLoading(false);
          }
        }
      })();
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [authClient]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      activeUser: user,
      getActiveUser: () => authClient.getCurrentUser(),
      accessToken,
      getAccessToken: () => accessToken,
      profile,
      isAuthenticated: Boolean(user),
      loading,
      error,
      login: async (email, password) => {
        setError(null);
        setLoading(true);
        try {
          const nextUser = await authClient.signInWithEmailAndPassword(email, password);
          const nextProfile = await authClient.getUserProfile(nextUser.uid);

          setUser(nextUser);
          setProfile(nextProfile);
          setAccessToken(await authClient.getAccessToken());
          return nextProfile;
        } catch (nextError) {
          setError(nextError instanceof Error ? nextError.message : "Login failed.");
          throw nextError;
        } finally {
          setLoading(false);
        }
      },
      register: async ({ email, password, role, country }) => {
        setError(null);
        setLoading(true);

        try {
          const result = await authClient.createUserWithEmailAndPassword(email, password);

          if (result.user) {
            await authClient.upsertUserProfile({
              uid: result.user.uid,
              email,
              role,
              country,
              investorType: role === "INVESTOR" ? "PROFESSIONAL" : undefined,
              companyName: role === "ASSET_PROVIDER" ? "Cityzeen Assets" : undefined,
            });
            await refreshSessionState(result.user);
            return { needsConfirmation: result.needsConfirmation, profile: await authClient.getUserProfile(result.user.uid) };
          }

          return { needsConfirmation: result.needsConfirmation, profile: null };
        } catch (nextError) {
          setError(nextError instanceof Error ? nextError.message : "Registration failed.");
          throw nextError;
        } finally {
          setLoading(false);
        }
      },
      confirmRegistration: async ({ email, password, code, role, country }) => {
        setError(null);
        setLoading(true);
        try {
          await authClient.confirmUserSignUp(email, code);
          const nextUser = await authClient.signInWithEmailAndPassword(email, password);
          await authClient.upsertUserProfile({
            uid: nextUser.uid,
            email,
            role,
            country,
            investorType: role === "INVESTOR" ? "PROFESSIONAL" : undefined,
            companyName: role === "ASSET_PROVIDER" ? "Cityzeen Assets" : undefined,
          });
          const nextProfile = await authClient.getUserProfile(nextUser.uid);
          setUser(nextUser);
          setProfile(nextProfile);
          setAccessToken(await authClient.getAccessToken());
          return nextProfile;
        } catch (nextError) {
          setError(nextError instanceof Error ? nextError.message : "Confirmation failed.");
          throw nextError;
        } finally {
          setLoading(false);
        }
      },
      resendConfirmationCode: async (email) => {
        setError(null);
        try {
          await authClient.resendConfirmationCode(email);
        } catch (nextError) {
          setError(nextError instanceof Error ? nextError.message : "Could not resend confirmation code.");
          throw nextError;
        }
      },
      logout: async () => {
        setError(null);
        setLoading(true);
        try {
          await authClient.signOut();
          setUser(null);
          setProfile(null);
          setAccessToken(null);
        } finally {
          setLoading(false);
        }
      },
      refreshProfile: async () => {
        await loadProfile(authClient.getCurrentUser());
      },
    }),
    [accessToken, authClient, error, loading, profile, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }

  return context;
}
