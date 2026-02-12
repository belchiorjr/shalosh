import { MissingSecuritySessionError } from "../../domain/errors/security-errors";
import type { Permission } from "../../domain/entities/permission";
import type { SecurityRepository } from "../../domain/repositories/security-repository";
import type { SecurityTokenProvider } from "../ports/security-token-provider";

export class DeactivatePermissionUseCase {
  constructor(
    private readonly securityRepository: SecurityRepository,
    private readonly tokenProvider: SecurityTokenProvider,
  ) {}

  async execute(permission: Permission): Promise<Permission> {
    const token = this.tokenProvider.getToken().trim();
    if (!token) {
      throw new MissingSecuritySessionError();
    }

    if (!permission.active) {
      return permission;
    }

    return this.securityRepository.updatePermission(token, permission.id, {
      code: permission.code.trim().toLowerCase(),
      name: permission.name.trim(),
      description: permission.description.trim(),
      active: false,
    });
  }
}

