import { MissingSecuritySessionError } from "../../domain/errors/security-errors";
import type { Profile } from "../../domain/entities/profile";
import type { SecurityRepository } from "../../domain/repositories/security-repository";
import type { SecurityTokenProvider } from "../ports/security-token-provider";

export class ListProfilesUseCase {
  constructor(
    private readonly securityRepository: SecurityRepository,
    private readonly tokenProvider: SecurityTokenProvider,
  ) {}

  async execute(): Promise<Profile[]> {
    const token = this.tokenProvider.getToken().trim();
    if (!token) {
      throw new MissingSecuritySessionError();
    }

    return this.securityRepository.listProfiles(token);
  }
}

