import type { EmailSettings } from "../entities/email-settings";

export interface SaveEmailSettingsInput {
  apiUrl: string;
  authUser: string;
  authPassword: string;
  fromEmail: string;
  fromName: string;
  adminResetUrl: string;
  clientResetUrl: string;
  tokenTtlMinutes: number;
  active: boolean;
}

export interface EmailSettingsRepository {
  getEmailSettings(token: string): Promise<EmailSettings>;
  saveEmailSettings(
    token: string,
    input: SaveEmailSettingsInput,
  ): Promise<EmailSettings>;
  sendTestEmail(token: string, toEmail: string): Promise<void>;
}
