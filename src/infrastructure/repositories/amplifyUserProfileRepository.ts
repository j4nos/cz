import type { UserProfile } from "@/src/domain/entities";
import { mapUserProfileRecord } from "@/src/infrastructure/amplify/schemaMappers";
import type { AmplifyDataClient } from "@/src/infrastructure/repositories/amplifyClient";

export class AmplifyUserProfileRepository {
  constructor(private readonly client: AmplifyDataClient) {}

  async createUserProfile(input: UserProfile): Promise<UserProfile> {
    const response = await this.client.models.UserProfile.create({
      id: input.id,
      email: input.email,
      role: input.role,
      country: input.country,
      investorType: input.investorType,
      companyName: input.companyName,
      kycStatus: input.kycStatus,
      createdAt: input.createdAt,
      updatedAt: input.updatedAt,
    });

    return response.data ? mapUserProfileRecord(response.data) : input;
  }

  async getUserProfileById(id: string): Promise<UserProfile | null> {
    const response = await this.client.models.UserProfile.get({ id });
    return response.data ? mapUserProfileRecord(response.data) : null;
  }

  async updateUserProfile(input: UserProfile): Promise<UserProfile> {
    const response = await this.client.models.UserProfile.update({
      id: input.id,
      email: input.email,
      role: input.role,
      country: input.country,
      investorType: input.investorType,
      companyName: input.companyName,
      kycStatus: input.kycStatus,
      createdAt: input.createdAt,
      updatedAt: input.updatedAt,
    });

    return response.data ? mapUserProfileRecord(response.data) : input;
  }

  async deleteUserProfile(id: string): Promise<void> {
    await this.client.models.UserProfile.delete({ id });
  }
}
