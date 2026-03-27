"use client";

import { createContext, useContext, useEffect, useMemo, useReducer } from "react";

import type { AuthUser } from "@/src/application/interfaces/authClient";
import type { UserProfile } from "@/src/domain/entities";
import { CheckIsAdminUserUseCase } from "@/src/application/use-cases/CheckIsAdminUserUseCase";
import { createAuthClient } from "@/src/presentation/composition/client";

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

type AuthState = {
  user: AuthUser | null;
  profile: UserProfile | null;
  accessToken: string | null;
  isAdmin: boolean;
  loading: boolean;
  error: string | null;
};

type AuthAction =
  | { type: "start_loading" }
  | { type: "finish_loading" }
  | { type: "clear_error" }
  | { type: "set_error"; payload: string }
  | {
      type: "set_session";
      payload: {
        user: AuthUser | null;
        profile: UserProfile | null;
        accessToken: string | null;
        isAdmin: boolean;
      };
    }
  | { type: "clear_session" };

const initialAuthState: AuthState = {
  user: null,
  profile: null,
  accessToken: null,
  isAdmin: false,
  loading: true,
  error: null,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "start_loading":
      return { ...state, loading: true };
    case "finish_loading":
      return { ...state, loading: false };
    case "clear_error":
      return { ...state, error: null };
    case "set_error":
      return { ...state, error: action.payload };
    case "set_session":
      return {
        ...state,
        user: action.payload.user,
        profile: action.payload.profile,
        accessToken: action.payload.accessToken,
        isAdmin: action.payload.isAdmin,
      };
    case "clear_session":
      return {
        ...state,
        user: null,
        profile: null,
        accessToken: null,
        isAdmin: false,
      };
    default:
      return state;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const authClient = useMemo(() => createAuthClient(), []);
  const checkIsAdminUseCase = useMemo(() => new CheckIsAdminUserUseCase(authClient), [authClient]);
  const [state, dispatch] = useReducer(authReducer, initialAuthState);
  const { user, profile, accessToken, isAdmin, loading, error } = state;

  const isGuest = profile?.role === "GUEST";

  async function refreshSessionState(nextUser: AuthUser | null) {
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
    dispatch({
      type: "set_session",
      payload: {
        user: nextUser,
        profile: nextProfile,
        accessToken: await authClient.getAccessToken(),
        isAdmin: Boolean(
          nextUser && nextProfile?.role !== "GUEST"
            ? await checkIsAdminUseCase.execute()
            : false,
        ),
      },
    });
  }

  useEffect(() => {
    let active = true;

    const unsubscribe = authClient.onAuthStateChanged((nextUser) => {
      void (async () => {
        if (!active) {
          return;
        }

        dispatch({ type: "start_loading" });
        try {
          await refreshSessionState(nextUser);
        } catch (nextError) {
          dispatch({ type: "clear_session" });
          dispatch({
            type: "set_error",
            payload: nextError instanceof Error ? nextError.message : "Failed to initialize auth.",
          });
        } finally {
          if (active) {
            dispatch({ type: "finish_loading" });
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
      signInWithGoogle: async () => {
        dispatch({ type: "clear_error" });
        await authClient.signInWithGoogle();
      },
      login: async (email, password) => {
        dispatch({ type: "clear_error" });
        dispatch({ type: "start_loading" });
        try {
          const nextUser = await authClient.signInWithEmailAndPassword(email, password);
          await refreshSessionState(nextUser);
          return await authClient.getUserProfile(nextUser.uid);
        } catch (nextError) {
          dispatch({
            type: "set_error",
            payload: nextError instanceof Error ? nextError.message : "Login failed.",
          });
          throw nextError;
        } finally {
          dispatch({ type: "finish_loading" });
        }
      },
      register: async ({ email, password, role, country }) => {
        dispatch({ type: "clear_error" });
        dispatch({ type: "start_loading" });

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
          dispatch({
            type: "set_error",
            payload: nextError instanceof Error ? nextError.message : "Registration failed.",
          });
          throw nextError;
        } finally {
          dispatch({ type: "finish_loading" });
        }
      },
      confirmRegistration: async ({ email, password, code, role, country }) => {
        dispatch({ type: "clear_error" });
        dispatch({ type: "start_loading" });
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
          await refreshSessionState(nextUser);
          return await authClient.getUserProfile(nextUser.uid);
        } catch (nextError) {
          dispatch({
            type: "set_error",
            payload: nextError instanceof Error ? nextError.message : "Confirmation failed.",
          });
          throw nextError;
        } finally {
          dispatch({ type: "finish_loading" });
        }
      },
      resendConfirmationCode: async (email) => {
        dispatch({ type: "clear_error" });
        try {
          await authClient.resendConfirmationCode(email);
        } catch (nextError) {
          dispatch({
            type: "set_error",
            payload: nextError instanceof Error ? nextError.message : "Could not resend confirmation code.",
          });
          throw nextError;
        }
      },
      requestPasswordReset: async (email) => {
        dispatch({ type: "clear_error" });
        try {
          await authClient.requestPasswordReset(email);
        } catch (nextError) {
          dispatch({
            type: "set_error",
            payload: nextError instanceof Error ? nextError.message : "Reset request failed.",
          });
          throw nextError;
        }
      },
      confirmPasswordReset: async (email, code, newPassword) => {
        dispatch({ type: "clear_error" });
        try {
          await authClient.confirmPasswordReset(email, code, newPassword);
        } catch (nextError) {
          dispatch({
            type: "set_error",
            payload: nextError instanceof Error ? nextError.message : "Reset failed.",
          });
          throw nextError;
        }
      },
      logout: async () => {
        dispatch({ type: "clear_error" });
        dispatch({ type: "start_loading" });
        try {
          await authClient.signOut();
          dispatch({ type: "clear_session" });
        } finally {
          dispatch({ type: "finish_loading" });
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
