import { MissingSecuritySessionError } from "../../domain/errors/security-errors";
import type { Permission } from "../../domain/entities/permission";
import type {
  SavePermissionInput,
  SecurityRepository,
} from "../../domain/repositories/security-repository";
import type { SecurityTokenProvider } from "../ports/security-token-provider";

export interface SavePermissionRequest extends SavePermissionInput {
  permissionId?: string;
}

export class SavePermissionUseCase {
  constructor(
    private readonly securityRepository: SecurityRepository,
    private readonly tokenProvider: SecurityTokenProvider,
  ) {}

  async execute(request: SavePermissionRequest): Promise<Permission> {
    const token = this.tokenProvider.getToken().trim();
    if (!token) {
      throw new MissingSecuritySessionError();
    }

    const input: SavePermissionInput = {
      code: request.code.trim().toLowerCase(),
      name: request.name.trim(),
      description: request.description.trim(),
      active: Boolean(request.active),
    };

    if (request.permissionId) {
      return this.securityRepository.updatePermission(
        token,
        request.permissionId,
        input,
      );
    }

    return this.securityRepository.createPermission(token, input);
  }
}

