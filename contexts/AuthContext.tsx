"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

import type { AuthUser } from "@/src/application/interfaces/authClient";
import type { UserProfile } from "@/src/domain/entities";
import { createAuthClient } from "@/src/infrastructure/auth/createAuthClient";
import { CheckIsAdminUserUseCase } from "@/src/application/use-cases/CheckIsAdminUserUseCase";

type AuthContextValue = {
  user: AuthUser | null;
  activeUser: AuthUser | null;
  getActiveUser: () => AuthUser | null;
  accessToken: string | null;
  getAccessToken: () => string | null;
  profile: UserProfile | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  loading: boolean;
  error: string | null;
  ensureAnonymous: () => Promise<AuthUser>;
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
  requestPasswordReset: (email: string) => Promise<void>;
  confirmPasswordReset: (
    email: string,
    code: string,
    newPassword: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const ANON_KEY = "cityzeen:anon-user-id";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const authClient = useMemo(() => createAuthClient(), []);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [anonUser, setAnonUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
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

  async function claimAnonymousSession(toUserId: string) {
    if (typeof window === "undefined") {
      return;
    }

    const fromUserId = window.localStorage.getItem(ANON_KEY);
    if (!fromUserId || fromUserId === toUserId) {
      return;
    }

    try {
      const token = await authClient.getAccessToken();
      await fetch("/api/chat/claim", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ toUserId }),
      });
    } finally {
      window.localStorage.removeItem(ANON_KEY);
      setAnonUser(null);
    }
  }

  async function ensureAnonymous(): Promise<AuthUser> {
    const current = authClient.getCurrentUser() ?? user;
    if (current) {
      return current;
    }

    if (anonUser) {
      return anonUser;
    }

    if (typeof window !== "undefined") {
      const cached = window.localStorage.getItem(ANON_KEY);
      if (cached) {
        const nextAnonUser = { uid: cached };
        setAnonUser(nextAnonUser);
        return nextAnonUser;
      }
    }

    const response = await fetch("/api/chat/anonymous", { method: "POST" });
    if (!response.ok) {
      throw new Error("Failed to start anonymous session.");
    }
    const data = (await response.json()) as { userId?: string };
    if (!data.userId) {
      throw new Error("Anonymous session missing user id.");
    }

    const nextAnonUser = { uid: data.userId };
    if (typeof window !== "undefined") {
      window.localStorage.setItem(ANON_KEY, data.userId);
    }
    setAnonUser(nextAnonUser);
    return nextAnonUser;
  }

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const cachedAnonId = window.localStorage.getItem(ANON_KEY);
    if (!cachedAnonId || user) {
      return;
    }

    setAnonUser({ uid: cachedAnonId });
  }, [user]);

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

  // Check admin status when authentication state changes
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!Boolean(user)) {
        setIsAdmin(false);
        return;
      }
      try {
        const useCase = new CheckIsAdminUserUseCase();
        const result = await useCase.execute();
        setIsAdmin(result);
      } catch (error) {
        console.error("Failed to check admin status:", error);
        setIsAdmin(false);
      }
    };
    void checkAdminStatus();
  }, [user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      activeUser: user ?? anonUser,
      getActiveUser: () => authClient.getCurrentUser() ?? anonUser,
      accessToken,
      getAccessToken: () => accessToken,
      profile,
      isAuthenticated: Boolean(user),
      isAdmin,
      loading,
      error,
      ensureAnonymous,
      login: async (email, password) => {
        setError(null);
        setLoading(true);
        try {
          const nextUser = await authClient.signInWithEmailAndPassword(email, password);
          const nextProfile = await authClient.getUserProfile(nextUser.uid);

          setUser(nextUser);
          setProfile(nextProfile);
          setAccessToken(await authClient.getAccessToken());
          await claimAnonymousSession(nextUser.uid);
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
            await claimAnonymousSession(result.user.uid);
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
          await claimAnonymousSession(nextUser.uid);
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
      requestPasswordReset: async (email) => {
        setError(null);
        try {
          await authClient.requestPasswordReset(email);
        } catch (nextError) {
          setError(nextError instanceof Error ? nextError.message : "Reset request failed.");
          throw nextError;
        }
      },
      confirmPasswordReset: async (email, code, newPassword) => {
        setError(null);
        try {
          await authClient.confirmPasswordReset(email, code, newPassword);
        } catch (nextError) {
          setError(nextError instanceof Error ? nextError.message : "Reset failed.");
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
          setIsAdmin(false);
        } finally {
          setLoading(false);
        }
      },
      refreshProfile: async () => {
        await loadProfile(authClient.getCurrentUser());
      },
    }),
    [accessToken, anonUser, authClient, error, isAdmin, loading, profile, user],
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
