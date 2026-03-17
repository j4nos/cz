import { getCurrentUser } from "aws-amplify/auth";

/**
 * Use case: Check if the current user is an admin (belongs to 'admin' Cognito group)
 */
export class CheckIsAdminUserUseCase {
  async execute(): Promise<boolean> {
    try {
      const user = await getCurrentUser();
      const groups = user.signInDetails?.loginAttributes?.groups || [];
      return groups.includes("admin");
    } catch (error) {
      console.error("Failed to check admin status:", error);
      return false;
    }
  }
}
