import type { AuthClient, AuthUser } from "@/src/application/interfaces/authClient";
import type { UserProfile } from "@/src/domain/entities";

type SaveProviderSettingsInput = {
  user: AuthUser | null;
  profile: UserProfile | null;
  companyName: string;
  country: string;
};

type SaveInvestorSettingsInput = {
  user: AuthUser | null;
  profile: UserProfile | null;
  country: string;
  investorType: string;
  companyName: string;
};

export class AccountSettingsService {
  constructor(
    private readonly authClient: AuthClient,
    private readonly deleteAccountRequest: (accessToken: string) => Promise<void>,
  ) {}

  async saveProviderSettings(input: SaveProviderSettingsInput): Promise<
    | { kind: "error"; message: string }
    | { kind: "success"; message: string }
  > {
    if (!input.user || !input.profile) {
      return { kind: "error", message: "Login to edit settings." };
    }

    await this.authClient.upsertUserProfile({
      uid: input.user.uid,
      email: input.profile.email,
      role: input.profile.role,
      country: input.country,
      companyName: input.companyName,
    });

    return { kind: "success", message: "Setting saved" };
  }

  async saveInvestorSettings(input: SaveInvestorSettingsInput): Promise<
    | { kind: "error"; message: string }
    | { kind: "success"; message: string }
  > {
    if (!input.user || !input.profile) {
      return { kind: "error", message: "Login to manage settings." };
    }

    const email = input.user.email;
    const role = input.profile.role;
    if (!email || !role) {
      return { kind: "error", message: "Missing user profile data." };
    }

    await this.authClient.upsertUserProfile({
      uid: input.user.uid,
      email,
      role,
      country: input.country,
      investorType: input.investorType,
      companyName: input.companyName,
      kycStatus: input.profile.kycStatus,
    });

    return { kind: "success", message: "Setting saved" };
  }

  async deleteAccount(accessToken?: string | null): Promise<
    | { kind: "error"; message: string }
    | { kind: "success"; message: string }
  > {
    if (!accessToken) {
      return { kind: "error", message: "Missing access token." };
    }

    await this.deleteAccountRequest(accessToken);
    return { kind: "success", message: "Account deleted." };
  }
}
