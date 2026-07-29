export interface PasswordRecoveryRepository {
  requestReset(login: string): Promise<string>;
  confirmReset(token: string, password: string): Promise<void>;
}
