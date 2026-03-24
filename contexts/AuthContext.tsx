"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

import type { AuthUser } from "@/src/application/interfaces/authClient";
import type { UserProfile } from "@/src/domain/entities";
import { CheckIsAdminUserUseCase } from "@/src/application/use-cases/CheckIsAdminUserUseCase";
import { createAuthClient } from "@/src/infrastructure/auth/createAuthClient";

type AuthContextValue = {
  user: AuthUser | null;
  activeUser: AuthUser | null;
  getActiveUser: () => AuthUser | null;
  accessToken: string | null;
  getAccessToken: () => string | null;
  profile: UserProfile | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  isAdmin: boolean;
  loading: boolean;
  error: string | null;
  ensureAnonymous: () => Promise<AuthUser>;
  signInWithGoogle: () => Promise<void>;
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
const GUEST_EMAIL_KEY = "cityzeen:guest-email";
const GUEST_PASSWORD_KEY = "cityzeen:guest-password";
const GUEST_USER_ID_KEY = "cityzeen:guest-user-id";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const authClient = useMemo(() => createAuthClient(), []);
  const checkIsAdminUseCase = useMemo(() => new CheckIsAdminUserUseCase(), []);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isGuest = profile?.role === "GUEST";

  async function refreshSessionState(nextUser: AuthUser | null) {
    setUser(nextUser);
    let nextProfile = nextUser ? await authClient.getUserProfile(nextUser.uid) : null;
    if (nextUser && !nextProfile && nextUser.email) {
      await authClient.upsertUserProfile({
        uid: nextUser.uid,
        email: nextUser.email,
        role: "INVESTOR",
        country: "HU",
        investorType: "RETAIL",
        kycStatus: "not-started",
      });
      nextProfile = await authClient.getUserProfile(nextUser.uid);
    }
    setProfile(nextProfile);
    setAccessToken(await authClient.getAccessToken());
    setIsAdmin(nextUser && nextProfile?.role !== "GUEST" ? await checkIsAdminUseCase.execute() : false);
  }

  function clearGuestStorage() {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.removeItem(GUEST_EMAIL_KEY);
    window.localStorage.removeItem(GUEST_PASSWORD_KEY);
    window.localStorage.removeItem(GUEST_USER_ID_KEY);
  }

  async function claimGuestSession(input: {
    fromUserId: string;
    guestAccessToken: string;
    toUserId: string;
    bearerToken: string;
  }) {
    const response = await fetch("/api/chat/claim", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${input.bearerToken}`,
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new Error(payload?.error ?? "Guest chat migration failed.");
    }
  }

  async function getGuestClaimContext() {
    if (!user || profile?.role !== "GUEST") {
      return null;
    }

    const guestAccessToken = await authClient.getAccessToken();
    if (!guestAccessToken) {
      return null;
    }

    return {
      fromUserId: user.uid,
      guestAccessToken,
    };
  }

  async function signOutCurrentGuestIfNeeded() {
    if (profile?.role !== "GUEST") {
      return;
    }

    await authClient.signOut();
    setUser(null);
    setProfile(null);
    setAccessToken(null);
    setIsAdmin(false);
  }

  async function ensureGuestProfile(nextUser: AuthUser, email: string) {
    await authClient.upsertUserProfile({
      uid: nextUser.uid,
      email,
      role: "GUEST",
      country: "HU",
      kycStatus: "approved",
    });
    await refreshSessionState(nextUser);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(GUEST_USER_ID_KEY, nextUser.uid);
    }
  }

  async function claimAnonymousSession(toUserId: string) {
    const guestClaim = await getGuestClaimContext();
    if (!guestClaim) {
      clearGuestStorage();
      return;
    }

    try {
      const token = await authClient.getAccessToken();
      if (!token) {
        return;
      }
      await claimGuestSession({
        ...guestClaim,
        toUserId,
        bearerToken: token,
      });
    } finally {
      clearGuestStorage();
    }
  }

  async function ensureAnonymous(): Promise<AuthUser> {
    const current = authClient.getCurrentUser() ?? user;
    if (current) {
      return current;
    }

    if (typeof window !== "undefined") {
      const cachedEmail = window.localStorage.getItem(GUEST_EMAIL_KEY);
      const cachedPassword = window.localStorage.getItem(GUEST_PASSWORD_KEY);
      if (cachedEmail && cachedPassword) {
        try {
          const nextUser = await authClient.signInWithEmailAndPassword(cachedEmail, cachedPassword);
          await ensureGuestProfile(nextUser, cachedEmail);
          return nextUser;
        } catch {
          clearGuestStorage();
        }
      }
    }

    const response = await fetch("/api/chat/anonymous", { method: "POST" });
    if (!response.ok) {
      throw new Error("Failed to start anonymous session.");
    }
    const data = (await response.json()) as { email?: string; password?: string };
    if (!data.email || !data.password) {
      throw new Error("Guest session is incomplete.");
    }

    const nextUser = await authClient.signInWithEmailAndPassword(data.email, data.password);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(GUEST_EMAIL_KEY, data.email);
      window.localStorage.setItem(GUEST_PASSWORD_KEY, data.password);
      window.localStorage.setItem(GUEST_USER_ID_KEY, nextUser.uid);
    }
    await ensureGuestProfile(nextUser, data.email);
    return nextUser;
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
      isAuthenticated: Boolean(user && profile?.role !== "GUEST"),
      isGuest,
      isAdmin,
      loading,
      error,
      ensureAnonymous,
      signInWithGoogle: async () => {
        setError(null);
        await authClient.signInWithGoogle();
      },
      login: async (email, password) => {
        setError(null);
        setLoading(true);
        try {
          const guestClaim = await getGuestClaimContext();
          await signOutCurrentGuestIfNeeded();
          const nextUser = await authClient.signInWithEmailAndPassword(email, password);
          await refreshSessionState(nextUser);
          if (guestClaim) {
            const bearerToken = await authClient.getAccessToken();
            if (bearerToken) {
              await claimGuestSession({
                ...guestClaim,
                toUserId: nextUser.uid,
                bearerToken,
              });
            }
          }
          clearGuestStorage();
          return await authClient.getUserProfile(nextUser.uid);
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
          const guestClaim = await getGuestClaimContext();
          await signOutCurrentGuestIfNeeded();
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
            if (guestClaim) {
              const bearerToken = await authClient.getAccessToken();
              if (bearerToken) {
                await claimGuestSession({
                  ...guestClaim,
                  toUserId: result.user.uid,
                  bearerToken,
                });
              }
            }
            clearGuestStorage();
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
          const guestClaim = await getGuestClaimContext();
          await signOutCurrentGuestIfNeeded();
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
          await refreshSessionState(nextUser);
          if (guestClaim) {
            const bearerToken = await authClient.getAccessToken();
            if (bearerToken) {
              await claimGuestSession({
                ...guestClaim,
                toUserId: nextUser.uid,
                bearerToken,
              });
            }
          }
          clearGuestStorage();
          return await authClient.getUserProfile(nextUser.uid);
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
          clearGuestStorage();
          setUser(null);
          setProfile(null);
          setAccessToken(null);
          setIsAdmin(false);
        } finally {
          setLoading(false);
        }
      },
      refreshProfile: async () => {
        await refreshSessionState(authClient.getCurrentUser());
      },
    }),
    [accessToken, authClient, checkIsAdminUseCase, error, isAdmin, isGuest, loading, profile, user],
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

export function usePublicAuth() {
  return useAuth();
}

export function usePrivateAuth() {
  const context = useAuth();

  if (context.loading) {
    throw new Error("Private auth hook used before auth finished loading.");
  }

  if (!context.user || !context.isAuthenticated) {
    throw new Error("Private auth hook used without authenticated user.");
  }

  return {
    ...context,
    user: context.user,
    activeUser: context.user,
    getActiveUser: () => context.user,
  };
}
