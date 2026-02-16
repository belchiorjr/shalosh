import {
  SecurityServiceUnavailableError,
  UnexpectedSecurityError,
} from "../domain/errors/security-errors";
import type { Permission } from "../domain/entities/permission";
import type { PermissionOption } from "../domain/entities/permission-option";
import type { Profile } from "../domain/entities/profile";
import type {
  CurrentUserSecurityContext,
  SavePermissionInput,
  SaveProfileInput,
  SecurityRepository,
} from "../domain/repositories/security-repository";
import type { HttpClient, HttpRequest } from "@/modules/shared/infrastructure/http/http-client";

interface ErrorApiResponse {
  error?: string;
}

interface ProfilePermissionsResponse {
  profileId: string;
  permissionIds: string[];
}

export class HttpSecurityRepository implements SecurityRepository {
  constructor(
    private readonly baseUrl: string,
    private readonly httpClient: HttpClient,
  ) {}

  async getCurrentUserSecurityContext(
    token: string,
  ): Promise<CurrentUserSecurityContext> {
    const payload = await this.request<unknown>(
      {
        url: this.buildUrl("/auth/me/profiles"),
        method: "GET",
        headers: this.withAuthHeaders(token),
      },
      "Não foi possível carregar o contexto de segurança do usuário.",
    );

    if (!isObject(payload)) {
      throw new UnexpectedSecurityError("Resposta inválida da API.");
    }

    return {
      isAdministrator: Boolean(payload.isAdministrator),
    };
  }

  async listPermissions(token: string): Promise<Permission[]> {
    const payload = await this.request<unknown>(
      {
        url: this.buildUrl("/permissions"),
        method: "GET",
        headers: this.withAuthHeaders(token),
      },
      "Não foi possível carregar as permissões.",
    );

    if (!Array.isArray(payload)) {
      throw new UnexpectedSecurityError("Resposta inválida da API.");
    }

    return payload.map((item) => mapPermission(item));
  }

  async createPermission(
    token: string,
    input: SavePermissionInput,
  ): Promise<Permission> {
    const payload = await this.request<unknown, SavePermissionInput>(
      {
        url: this.buildUrl("/permissions"),
        method: "POST",
        headers: this.withAuthHeaders(token, true),
        body: input,
      },
      "Não foi possível salvar a permissão.",
    );

    return mapPermission(payload);
  }

  async updatePermission(
    token: string,
    permissionId: string,
    input: SavePermissionInput,
  ): Promise<Permission> {
    const payload = await this.request<unknown, SavePermissionInput>(
      {
        url: this.buildUrl(`/permissions/${permissionId}`),
        method: "PATCH",
        headers: this.withAuthHeaders(token, true),
        body: input,
      },
      "Não foi possível salvar a permissão.",
    );

    return mapPermission(payload);
  }

  async listProfiles(token: string): Promise<Profile[]> {
    const payload = await this.request<unknown>(
      {
        url: this.buildUrl("/profiles"),
        method: "GET",
        headers: this.withAuthHeaders(token),
      },
      "Não foi possível carregar os perfis.",
    );

    if (!Array.isArray(payload)) {
      throw new UnexpectedSecurityError("Resposta inválida da API.");
    }

    return payload.map((item) => mapProfile(item));
  }

  async createProfile(token: string, input: SaveProfileInput): Promise<Profile> {
    const payload = await this.request<unknown, Omit<SaveProfileInput, "permissionIds">>(
      {
        url: this.buildUrl("/profiles"),
        method: "POST",
        headers: this.withAuthHeaders(token, true),
        body: {
          name: input.name,
          description: input.description,
          active: input.active,
        },
      },
      "Não foi possível salvar o perfil.",
    );

    return mapProfile(payload);
  }

  async updateProfile(
    token: string,
    profileId: string,
    input: SaveProfileInput,
  ): Promise<Profile> {
    const payload = await this.request<unknown, Omit<SaveProfileInput, "permissionIds">>(
      {
        url: this.buildUrl(`/profiles/${profileId}`),
        method: "PATCH",
        headers: this.withAuthHeaders(token, true),
        body: {
          name: input.name,
          description: input.description,
          active: input.active,
        },
      },
      "Não foi possível salvar o perfil.",
    );

    return mapProfile(payload);
  }

  async listPermissionOptions(token: string): Promise<PermissionOption[]> {
    const permissions = await this.listPermissions(token);
    return permissions.map((permission) => ({
      id: permission.id,
      code: permission.code,
      name: permission.name,
      active: permission.active,
    }));
  }

  async getProfilePermissionIds(
    token: string,
    profileId: string,
  ): Promise<string[]> {
    const payload = await this.request<unknown>(
      {
        url: this.buildUrl(`/profiles/${profileId}/permissions`),
        method: "GET",
        headers: this.withAuthHeaders(token),
      },
      "Não foi possível carregar permissões do perfil.",
    );

    if (!isObject(payload)) {
      throw new UnexpectedSecurityError("Resposta inválida da API.");
    }

    const permissionIds = payload.permissionIds;
    if (!Array.isArray(permissionIds)) {
      throw new UnexpectedSecurityError("Resposta inválida da API.");
    }

    return permissionIds
      .filter((permissionId): permissionId is string => typeof permissionId === "string")
      .map((permissionId) => permissionId.trim())
      .filter(Boolean);
  }

  async replaceProfilePermissions(
    token: string,
    profileId: string,
    permissionIds: string[],
  ): Promise<void> {
    await this.request<ProfilePermissionsResponse, { permissionIds: string[] }>(
      {
        url: this.buildUrl(`/profiles/${profileId}/permissions`),
        method: "PUT",
        headers: this.withAuthHeaders(token, true),
        body: { permissionIds },
      },
      "Não foi possível vincular permissões ao perfil.",
    );
  }

  private async request<TResponse, TBody = unknown>(
    request: HttpRequest<TBody>,
    fallbackErrorMessage: string,
  ): Promise<TResponse> {
    try {
      const response = await this.httpClient.request<TResponse | ErrorApiResponse, TBody>(
        request,
      );

      if (response.status < 200 || response.status >= 300) {
        throw new UnexpectedSecurityError(
          this.extractErrorMessage(response.data, fallbackErrorMessage),
        );
      }

      return response.data as TResponse;
    } catch (error) {
      if (error instanceof UnexpectedSecurityError) {
        throw error;
      }

      throw new SecurityServiceUnavailableError();
    }
  }

  private withAuthHeaders(
    token: string,
    withJsonContentType = false,
  ): Record<string, string> {
    return {
      ...(withJsonContentType ? { "Content-Type": "application/json" } : {}),
      Authorization: `Bearer ${token}`,
    };
  }

  private buildUrl(path: string): string {
    return `${this.baseUrl.replace(/\/+$/, "")}${path}`;
  }

  private extractErrorMessage(data: unknown, fallback: string): string {
    if (isObject(data) && typeof data.error === "string" && data.error.trim()) {
      return data.error;
    }

    return fallback;
  }
}

function mapPermission(payload: unknown): Permission {
  if (!isObject(payload)) {
    throw new UnexpectedSecurityError("Resposta inválida da API.");
  }

  return {
    id: toStringOrEmpty(payload.id),
    code: toStringOrEmpty(payload.code),
    name: toStringOrEmpty(payload.name),
    description: toStringOrEmpty(payload.description),
    active: Boolean(payload.active),
    created: toOptionalString(payload.created),
    updated: toOptionalString(payload.updated),
  };
}

function mapProfile(payload: unknown): Profile {
  if (!isObject(payload)) {
    throw new UnexpectedSecurityError("Resposta inválida da API.");
  }

  return {
    id: toStringOrEmpty(payload.id),
    name: toStringOrEmpty(payload.name),
    description: toStringOrEmpty(payload.description),
    active: Boolean(payload.active),
    permissionCount: toNumberOrZero(payload.permissionCount),
    created: toOptionalString(payload.created),
    updated: toOptionalString(payload.updated),
  };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toStringOrEmpty(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function toOptionalString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function toNumberOrZero(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}
