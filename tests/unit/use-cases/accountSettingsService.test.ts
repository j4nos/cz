import { describe, expect, it, vi } from "vitest";

import type { AuthClient } from "@/src/application/interfaces/authClient";
import { AccountSettingsService } from "@/src/application/use-cases/accountSettingsService";
import { makeUserProfile } from "@/tests/helpers/factories";

function makeAuthClient(): AuthClient {
  return {
    onAuthStateChanged: vi.fn(),
    getAccessToken: vi.fn(),
    signInWithEmailAndPassword: vi.fn(),
    createUserWithEmailAndPassword: vi.fn(),
    confirmUserSignUp: vi.fn(),
    resendConfirmationCode: vi.fn(),
    requestPasswordReset: vi.fn(),
    confirmPasswordReset: vi.fn(),
    signOut: vi.fn(),
    getCurrentUser: vi.fn(),
    getUserProfile: vi.fn(),
    upsertUserProfile: vi.fn().mockResolvedValue(undefined),
  };
}

describe("AccountSettingsService", () => {
  it("requires login for provider settings", async () => {
    const service = new AccountSettingsService(makeAuthClient(), vi.fn());

    await expect(
      service.saveProviderSettings({ user: null, profile: null, companyName: "Cityzeen", country: "HU" }),
    ).resolves.toEqual({ kind: "error", message: "Login to edit settings." });
  });

  it("requires login for investor settings", async () => {
    const service = new AccountSettingsService(makeAuthClient(), vi.fn());

    await expect(
      service.saveInvestorSettings({
        user: null,
        profile: null,
        country: "HU",
        investorType: "PROFESSIONAL",
        companyName: "Investor Co",
      }),
    ).resolves.toEqual({ kind: "error", message: "Login to manage settings." });
  });

  it("requires email and role for investor settings", async () => {
    const service = new AccountSettingsService(makeAuthClient(), vi.fn());

    const result = await service.saveInvestorSettings({
      user: { uid: "user-1" },
      profile: makeUserProfile({ role: undefined as never }),
      country: "HU",
      investorType: "PROFESSIONAL",
      companyName: "Investor Co",
    });

    expect(result).toEqual({ kind: "error", message: "Missing user profile data." });
  });

  it("persists provider settings through the auth client", async () => {
    const authClient = makeAuthClient();
    const service = new AccountSettingsService(authClient, vi.fn());

    const result = await service.saveProviderSettings({
      user: { uid: "provider-1", email: "provider@example.com" },
      profile: makeUserProfile({ id: "provider-1", email: "provider@example.com", role: "ASSET_PROVIDER" }),
      companyName: "Cityzeen",
      country: "HU",
    });

    expect(authClient.upsertUserProfile).toHaveBeenCalledWith({
      uid: "provider-1",
      email: "provider@example.com",
      role: "ASSET_PROVIDER",
      country: "HU",
      companyName: "Cityzeen",
    });
    expect(result).toEqual({ kind: "success", message: "Setting saved" });
  });

  it("requires an access token before deleting an account and calls the delete request on success", async () => {
    const deleteAccountRequest = vi.fn().mockResolvedValue(undefined);
    const service = new AccountSettingsService(makeAuthClient(), deleteAccountRequest);

    await expect(service.deleteAccount()).resolves.toEqual({ kind: "error", message: "Missing access token." });

    await expect(service.deleteAccount("token")).resolves.toEqual({ kind: "success", message: "Account deleted." });
    expect(deleteAccountRequest).toHaveBeenCalledWith("token");
  });
});
