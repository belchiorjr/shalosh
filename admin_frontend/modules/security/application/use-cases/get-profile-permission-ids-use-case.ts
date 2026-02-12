import { MissingSecuritySessionError } from "../../domain/errors/security-errors";
import type { SecurityRepository } from "../../domain/repositories/security-repository";
import type { SecurityTokenProvider } from "../ports/security-token-provider";

export class GetProfilePermissionIdsUseCase {
  constructor(
    private readonly securityRepository: SecurityRepository,
    private readonly tokenProvider: SecurityTokenProvider,
  ) {}

  async execute(profileId: string): Promise<string[]> {
    const token = this.tokenProvider.getToken().trim();
    if (!token) {
      throw new MissingSecuritySessionError();
    }

    return this.securityRepository.getProfilePermissionIds(
      token,
      profileId.trim(),
    );
  }
}

