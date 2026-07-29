import {
  EmailSettingsNotConfiguredError,
  EmailSettingsServiceUnavailableError,
  UnexpectedEmailSettingsError,
} from "../domain/errors/email-settings-errors";
import type { EmailSettings } from "../domain/entities/email-settings";
import type {
  EmailSettingsRepository,
  SaveEmailSettingsInput,
} from "../domain/repositories/email-settings-repository";
import type {
  HttpClient,
  HttpRequest,
} from "@/modules/shared/infrastructure/http/http-client";

interface ErrorApiResponse {
  error?: string;
}

export class HttpEmailSettingsRepository implements EmailSettingsRepository {
  constructor(
    private readonly baseUrl: string,
    private readonly httpClient: HttpClient,
  ) {}

  async getEmailSettings(token: string): Promise<EmailSettings> {
    const payload = await this.request<unknown>(
      {
        url: this.buildUrl("/settings/email"),
        method: "GET",
        headers: this.withAuthHeaders(token),
      },
      "Não foi possível carregar a configuração de e-mail.",
    );

    return mapEmailSettings(payload);
  }

  async saveEmailSettings(
    token: string,
    input: SaveEmailSettingsInput,
  ): Promise<EmailSettings> {
    const payload = await this.request<unknown, SaveEmailSettingsInput>(
      {
        url: this.buildUrl("/settings/email"),
        method: "PUT",
        headers: this.withAuthHeaders(token, true),
        body: input,
      },
      "Não foi possível salvar a configuração de e-mail.",
    );

    return mapEmailSettings(payload);
  }

  async sendTestEmail(token: string, toEmail: string): Promise<void> {
    await this.request<unknown, { toEmail: string }>(
      {
        url: this.buildUrl("/settings/email/test"),
        method: "POST",
        headers: this.withAuthHeaders(token, true),
        body: { toEmail },
      },
      "Não foi possível enviar o e-mail de teste.",
    );
  }

  private buildUrl(path: string): string {
    return `${this.baseUrl}${path}`;
  }

  private withAuthHeaders(
    token: string,
    withJsonBody = false,
  ): Record<string, string> {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
    };
    if (withJsonBody) {
      headers["Content-Type"] = "application/json";
    }

    return headers;
  }

  private async request<TResponse, TBody = unknown>(
    request: HttpRequest<TBody>,
    fallbackMessage: string,
  ): Promise<TResponse> {
    let response;

    try {
      response = await this.httpClient.request<TResponse, TBody>(request);
    } catch {
      throw new EmailSettingsServiceUnavailableError();
    }

    if (response.status >= 200 && response.status < 300) {
      return response.data;
    }

    const message =
      (response.data as ErrorApiResponse | undefined)?.error || fallbackMessage;

    if (response.status === 412) {
      throw new EmailSettingsNotConfiguredError(message);
    }

    throw new UnexpectedEmailSettingsError(message);
  }
}

function mapEmailSettings(payload: unknown): EmailSettings {
  if (!isObject(payload)) {
    throw new UnexpectedEmailSettingsError("Resposta inválida da API.");
  }

  return {
    id: String(payload.id || ""),
    provider: String(payload.provider || "turbosmtp"),
    apiUrl: String(payload.apiUrl || ""),
    authUser: String(payload.authUser || ""),
    hasAuthPassword: Boolean(payload.hasAuthPassword),
    fromEmail: String(payload.fromEmail || ""),
    fromName: String(payload.fromName || ""),
    adminResetUrl: String(payload.adminResetUrl || ""),
    clientResetUrl: String(payload.clientResetUrl || ""),
    tokenTtlMinutes: Number(payload.tokenTtlMinutes || 60),
    active: Boolean(payload.active),
    configurationOk: Boolean(payload.configurationOk),
  };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
