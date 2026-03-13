"use client";

import { Hub } from "aws-amplify/utils";
import {
  confirmResetPassword,
  confirmSignIn,
  confirmSignUp,
  fetchAuthSession,
  getCurrentUser as getAmplifyCurrentUser,
  resendSignUpCode,
  resetPassword,
  signIn,
  signOut,
  signUp,
} from "aws-amplify/auth";

import type { AuthClient, AuthUser } from "@/src/auth/client";
import type { UserProfile } from "@/src/domain/entities";
import { ensureAmplifyConfigured } from "@/src/infrastructure/amplify/config";
import { AmplifyInvestmentRepository } from "@/src/infrastructure/repositories/amplifyInvestmentRepository";

const listeners = new Set<(user: AuthUser | null) => void>();

function mapCurrentUser(user: Awaited<ReturnType<typeof getAmplifyCurrentUser>> | null): AuthUser | null {
  if (!user) {
    return null;
  }

  return {
    uid: user.userId,
    email: user.signInDetails?.loginId,
  };
}

async function readCurrentUser(): Promise<AuthUser | null> {
  try {
    ensureAmplifyConfigured();
    const user = await getAmplifyCurrentUser();
    const mapped = mapCurrentUser(user);
    console.log("[AUTH_DEBUG] readCurrentUser success", mapped);
    return mapped;
  } catch {
    console.log("[AUTH_DEBUG] readCurrentUser miss");
    return null;
  }
}

async function readUserFromSession(): Promise<AuthUser | null> {
  try {
    ensureAmplifyConfigured();
    const session = await fetchAuthSession();
    const payload = session.tokens?.idToken?.payload;
    const uid = typeof payload?.sub === "string" ? payload.sub : null;
    const email = typeof payload?.email === "string" ? payload.email : undefined;

    if (!uid) {
      console.log("[AUTH_DEBUG] readUserFromSession no uid", {
        hasAccessToken: Boolean(session.tokens?.accessToken),
        hasIdToken: Boolean(session.tokens?.idToken),
      });
      return null;
    }

    const mapped = {
      uid,
      email,
    };
    console.log("[AUTH_DEBUG] readUserFromSession success", mapped);
    return mapped;
  } catch {
    console.log("[AUTH_DEBUG] readUserFromSession miss");
    return null;
  }
}

async function waitForCurrentUser(retries = 10, delayMs = 150): Promise<AuthUser | null> {
  for (let index = 0; index < retries; index += 1) {
    const user = (await readUserFromSession()) ?? (await readCurrentUser());
    if (user) {
      return user;
    }

    await new Promise((resolve) => window.setTimeout(resolve, delayMs));
  }

  return null;
}

async function notify() {
  const user = await readCurrentUser();
  console.log("[AUTH_DEBUG] notify listeners", user);
  listeners.forEach((listener) => {
    listener(user);
  });
}

export function createAmplifyAuthClient(): AuthClient {
  const repository = new AmplifyInvestmentRepository();
  let cachedUser: AuthUser | null = null;

  return {
    onAuthStateChanged(handler) {
      listeners.add(handler);
      void readCurrentUser().then((user) => {
        cachedUser = user;
        console.log("[AUTH_DEBUG] onAuthStateChanged initial", user);
        handler(user);
      });
      const cancelHub = Hub.listen("auth", (event) => {
        console.log("[AUTH_DEBUG] Hub auth event", event.payload?.event);
        void readCurrentUser().then((user) => {
          cachedUser = user;
          console.log("[AUTH_DEBUG] onAuthStateChanged hub refresh", user);
          handler(user);
        });
      });

      return () => {
        listeners.delete(handler);
        cancelHub();
      };
    },
    async getAccessToken() {
      try {
        ensureAmplifyConfigured();
        const session = await fetchAuthSession();
        console.log("[AUTH_DEBUG] getAccessToken", Boolean(session.tokens?.accessToken));
        return session.tokens?.accessToken?.toString() ?? null;
      } catch {
        console.log("[AUTH_DEBUG] getAccessToken miss");
        return null;
      }
    },
    async signInWithEmailAndPassword(email: string, password: string) {
      ensureAmplifyConfigured();
      console.log("[AUTH_DEBUG] signIn start", { email });
      const result = await signIn({ username: email, password });
      console.log("[AUTH_DEBUG] signIn result", result);

      if (result.nextStep.signInStep === "CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED") {
        await confirmSignIn({ challengeResponse: password });
      } else if (result.nextStep.signInStep === "CONFIRM_SIGN_UP") {
        throw new Error("This account is not confirmed yet. Complete email confirmation first.");
      } else if (result.nextStep.signInStep !== "DONE") {
        throw new Error(`Cognito requires an additional sign-in step: ${result.nextStep.signInStep}.`);
      }

      const user = await waitForCurrentUser();
      console.log("[AUTH_DEBUG] signIn waitForCurrentUser result", user);
      if (!user) {
        throw new Error("Amplify login completed without an authenticated user.");
      }

      cachedUser = user;
      await notify();
      return user;
    },
    async createUserWithEmailAndPassword(email: string, password: string) {
      ensureAmplifyConfigured();
      const result = await signUp({
        username: email,
        password,
        options: {
          userAttributes: {
            email,
          },
        },
      });

      if (!result.isSignUpComplete) {
        return { needsConfirmation: true };
      }

      const user = await this.signInWithEmailAndPassword(email, password);
      return {
        user,
        needsConfirmation: false,
      };
    },
    async confirmUserSignUp(email: string, code: string) {
      ensureAmplifyConfigured();
      await confirmSignUp({ username: email, confirmationCode: code });
    },
    async resendConfirmationCode(email: string) {
      ensureAmplifyConfigured();
      await resendSignUpCode({ username: email });
    },
    async requestPasswordReset(email: string) {
      ensureAmplifyConfigured();
      await resetPassword({ username: email });
    },
    async confirmPasswordReset(email: string, code: string, newPassword: string) {
      ensureAmplifyConfigured();
      await confirmResetPassword({ username: email, confirmationCode: code, newPassword });
    },
    async signOut() {
      ensureAmplifyConfigured();
      console.log("[AUTH_DEBUG] signOut start");
      await signOut();
      cachedUser = null;
      await notify();
    },
    getCurrentUser() {
      return cachedUser;
    },
    async getUserProfile(uid: string) {
      try {
        return await repository.getUserProfileById(uid);
      } catch {
        return null;
      }
    },
    async upsertUserProfile(input) {
      const existing = await repository.getUserProfileById(input.uid);
      const now = new Date().toISOString();
      if (existing) {
        await repository.updateUserProfile({
          ...existing,
          email: input.email,
          role: input.role,
          country: input.country ?? existing.country,
          investorType: input.investorType ?? existing.investorType,
          companyName: input.companyName ?? existing.companyName,
          kycStatus: input.kycStatus ?? existing.kycStatus,
          updatedAt: now,
        });
        return;
      }

      const next: UserProfile = {
        id: input.uid,
        email: input.email,
        role: input.role,
        country: input.country ?? "HU",
        investorType: input.investorType,
        companyName: input.companyName,
        kycStatus: input.kycStatus ?? "approved",
        createdAt: now,
        updatedAt: now,
      };
      await repository.createUserProfile(next);
    },
  };
}
