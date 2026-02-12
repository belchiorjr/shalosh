import { MissingSecuritySessionError } from "../../domain/errors/security-errors";
import type { Permission } from "../../domain/entities/permission";
import type { SecurityRepository } from "../../domain/repositories/security-repository";
import type { SecurityTokenProvider } from "../ports/security-token-provider";

export class ListPermissionsUseCase {
  constructor(
    private readonly securityRepository: SecurityRepository,
    private readonly tokenProvider: SecurityTokenProvider,
  ) {}

  async execute(): Promise<Permission[]> {
    const token = this.tokenProvider.getToken().trim();
    if (!token) {
      throw new MissingSecuritySessionError();
    }

    return this.securityRepository.listPermissions(token);
  }
}

