import {
  InvalidPasswordRecoveryInputError,
  PasswordRecoveryServiceUnavailableError,
  UnexpectedPasswordRecoveryError,
} from "../domain/errors/password-recovery-errors";
import type { PasswordRecoveryRepository } from "../domain/repositories/password-recovery-repository";
import type {
  HttpClient,
  HttpRequest,
} from "@/modules/shared/infrastructure/http/http-client";

interface PasswordRecoveryApiResponse {
  error?: string;
  message?: string;
}

export class HttpPasswordRecoveryRepository
  implements PasswordRecoveryRepository
{
  constructor(
    private readonly baseUrl: string,
    private readonly httpClient: HttpClient,
  ) {}

  async requestReset(login: string): Promise<string> {
    const payload = await this.request<
      PasswordRecoveryApiResponse,
      { login: string }
    >(
      {
        url: `${this.baseUrl}/auth/forgot-password`,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: { login },
      },
      "Não foi possível solicitar a recuperação de senha.",
    );

    return (
      payload?.message ||
      "Se a conta existir, enviaremos um e-mail com as instruções de recuperação."
    );
  }

  async confirmReset(token: string, password: string): Promise<void> {
    await this.request<
      PasswordRecoveryApiResponse,
      { token: string; password: string }
    >(
      {
        url: `${this.baseUrl}/auth/reset-password`,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: { token, password },
      },
      "Não foi possível redefinir a senha.",
    );
  }

  private async request<TResponse, TBody = unknown>(
    request: HttpRequest<TBody>,
    fallbackMessage: string,
  ): Promise<TResponse> {
    let response;

    try {
      response = await this.httpClient.request<TResponse, TBody>(request);
    } catch {
      throw new PasswordRecoveryServiceUnavailableError();
    }

    if (response.status >= 200 && response.status < 300) {
      return response.data;
    }

    const message =
      (response.data as PasswordRecoveryApiResponse | undefined)?.error ||
      fallbackMessage;

    if (response.status === 400) {
      throw new InvalidPasswordRecoveryInputError(message);
    }

    throw new UnexpectedPasswordRecoveryError(message);
  }
}
