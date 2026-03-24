import type { InvestorType, UserProfile, UserRole } from "@/src/domain/entities";

export type AuthUser = {
  uid: string;
  email?: string;
};

export type RegisterResult = {
  user?: AuthUser;
  needsConfirmation: boolean;
};

export type AuthClient = {
  onAuthStateChanged: (handler: (user: AuthUser | null) => void) => () => void;
  getAccessToken: () => Promise<string | null>;
  signInWithEmailAndPassword: (email: string, password: string) => Promise<AuthUser>;
  signInWithGoogle: () => Promise<void>;
  createUserWithEmailAndPassword: (email: string, password: string) => Promise<RegisterResult>;
  confirmUserSignUp: (email: string, code: string) => Promise<void>;
  resendConfirmationCode: (email: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  confirmPasswordReset: (email: string, code: string, newPassword: string) => Promise<void>;
  signOut: () => Promise<void>;
  getCurrentUser: () => AuthUser | null;
  getUserProfile: (uid: string) => Promise<UserProfile | null>;
  upsertUserProfile: (input: {
    uid: string;
    email: string;
    role: UserRole;
    country?: string;
    investorType?: InvestorType;
    companyName?: string;
    kycStatus?: UserProfile["kycStatus"];
  }) => Promise<void>;
};
