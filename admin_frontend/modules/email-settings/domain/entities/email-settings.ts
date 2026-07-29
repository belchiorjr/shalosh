export interface EmailSettings {
  id: string;
  provider: string;
  apiUrl: string;
  authUser: string;
  hasAuthPassword: boolean;
  fromEmail: string;
  fromName: string;
  adminResetUrl: string;
  clientResetUrl: string;
  tokenTtlMinutes: number;
  active: boolean;
  configurationOk: boolean;
}
