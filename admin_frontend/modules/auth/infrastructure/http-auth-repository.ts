import {
  AuthServiceUnavailableError,
  InvalidCredentialsError,
  UnexpectedAuthError,
} from "../domain/errors/auth-errors";
import type { AuthSession } from "../domain/entities/auth-session";
import type { AuthRepository } from "../domain/repositories/auth-repository";
import type { LoginCredentials } from "../domain/value-objects/login-credentials";
import type { HttpClient } from "@/modules/shared/infrastructure/http/http-client";

interface LoginApiUser {
  id: string;
  name: string;
  email: string;
  login: string;
  active: boolean;
  phone?: string;
  address?: string;
  avatar?: string;
}

interface LoginApiResponse {
  token: string;
  tokenType?: string;
  expiresAt?: string;
  user: LoginApiUser;
}

interface ErrorApiResponse {
  error?: string;
}

export class HttpAuthRepository implements AuthRepository {
  constructor(
    private readonly baseUrl: string,
    private readonly httpClient: HttpClient,
  ) {}

  async login(credentials: LoginCredentials): Promise<AuthSession> {
    const endpoint = `${this.baseUrl.replace(/\/+$/, "")}/auth/login`;

    try {
      const response = await this.httpClient.request<
        LoginApiResponse | ErrorApiResponse,
        LoginCredentials
      >({
        url: endpoint,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: credentials,
      });

      if (response.status === 401) {
        throw new InvalidCredentialsError();
      }

      if (response.status < 200 || response.status >= 300) {
        throw new UnexpectedAuthError(this.extractErrorMessage(response.data));
      }

      return this.mapResponseToSession(response.data as LoginApiResponse);
    } catch (error) {
      if (
        error instanceof InvalidCredentialsError ||
        error instanceof UnexpectedAuthError
      ) {
        throw error;
      }

      throw new AuthServiceUnavailableError();
    }
  }

  private extractErrorMessage(
    payload: LoginApiResponse | ErrorApiResponse,
  ): string {
    if ("error" in payload && payload.error) {
      return payload.error;
    }

    return "Authentication failed.";
  }

  private mapResponseToSession(payload: LoginApiResponse): AuthSession {
    if (!payload.token || !payload.user) {
      throw new UnexpectedAuthError("Invalid authentication payload.");
    }

    return {
      token: payload.token,
      tokenType: payload.tokenType || "Bearer",
      expiresAt: this.parseExpiresAt(payload.expiresAt),
      user: {
        id: payload.user.id,
        name: payload.user.name,
        email: payload.user.email,
        login: payload.user.login,
        active: Boolean(payload.user.active),
        phone: payload.user.phone || "",
        address: payload.user.address || "",
        avatar: payload.user.avatar || "",
      },
    };
  }

  private parseExpiresAt(expiresAt?: string): Date | null {
    if (!expiresAt) {
      return null;
    }

    const parsedDate = new Date(expiresAt);
    if (Number.isNaN(parsedDate.getTime())) {
      return null;
    }

    return parsedDate;
  }
}
