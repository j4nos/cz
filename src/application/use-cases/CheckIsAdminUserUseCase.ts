import type { AuthClient } from "@/src/application/interfaces/authClient";

/**
 * Use case: Check if the current user is an admin (belongs to 'admin' Cognito group)
 */
export class CheckIsAdminUserUseCase {
  constructor(private readonly authClient: AuthClient) {}

  async execute(): Promise<boolean> {
    try {
      const groups = await this.authClient.getCurrentGroups();
      return groups.includes("admin");
    } catch (error) {
      console.error("Failed to check admin status:", error);
      return false;
    }
  }
}
