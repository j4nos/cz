import type { InvestmentRepository } from "@/src/domain/repositories/investmentRepository";

type DeleteAuthUser = (input: {
  userPoolId: string;
  username: string;
  region: string;
}) => Promise<void>;

export class DeleteAccountService {
  constructor(
    private readonly repository: Pick<InvestmentRepository, "deleteUserProfile">,
    private readonly deleteAuthUser: DeleteAuthUser,
  ) {}

  async deleteAccount(input: {
    userId: string;
    email?: string;
    userPoolId: string;
    region: string;
  }): Promise<void> {
    await this.repository.deleteUserProfile(input.userId);

    try {
      await this.deleteAuthUser({
        userPoolId: input.userPoolId,
        username: input.userId,
        region: input.region,
      });
    } catch (error) {
      if (!input.email) {
        throw error;
      }

      await this.deleteAuthUser({
        userPoolId: input.userPoolId,
        username: input.email,
        region: input.region,
      });
    }
  }
}
