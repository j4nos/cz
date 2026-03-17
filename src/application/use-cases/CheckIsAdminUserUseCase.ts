import { fetchAuthSession } from "aws-amplify/auth";

/**
 * Use case: Check if the current user is an admin (belongs to 'admin' Cognito group)
 */
export class CheckIsAdminUserUseCase {
  async execute(): Promise<boolean> {
    try {
      const session = await fetchAuthSession();
      const groupsClaim = session.tokens?.idToken?.payload?.["cognito:groups"];
      const groups = Array.isArray(groupsClaim)
        ? groupsClaim
        : typeof groupsClaim === "string"
          ? [groupsClaim]
          : [];
      return groups.includes("admin");
    } catch (error) {
      console.error("Failed to check admin status:", error);
      return false;
    }
  }
}
