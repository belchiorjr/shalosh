import { MissingSecuritySessionError } from "../../domain/errors/security-errors";
import type { PermissionOption } from "../../domain/entities/permission-option";
import type { SecurityRepository } from "../../domain/repositories/security-repository";
import type { SecurityTokenProvider } from "../ports/security-token-provider";

export class ListPermissionOptionsUseCase {
  constructor(
    private readonly securityRepository: SecurityRepository,
    private readonly tokenProvider: SecurityTokenProvider,
  ) {}

  async execute(): Promise<PermissionOption[]> {
    const token = this.tokenProvider.getToken().trim();
    if (!token) {
      throw new MissingSecuritySessionError();
    }

    return this.securityRepository.listPermissionOptions(token);
  }
}

