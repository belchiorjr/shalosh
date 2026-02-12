import type { AuthUser } from "./auth-user";

export interface AuthSession {
  token: string;
  tokenType: string;
  expiresAt: Date | null;
  user: AuthUser;
}
