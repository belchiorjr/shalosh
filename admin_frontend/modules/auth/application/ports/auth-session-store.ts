import type { AuthSession } from "../../domain/entities/auth-session";

export interface AuthSessionStore {
  save(session: AuthSession): void;
  clear(): void;
}
