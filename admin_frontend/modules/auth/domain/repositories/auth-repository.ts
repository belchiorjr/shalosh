import type { AuthSession } from "../entities/auth-session";
import type { LoginCredentials } from "../value-objects/login-credentials";

export interface AuthRepository {
  login(credentials: LoginCredentials): Promise<AuthSession>;
}
