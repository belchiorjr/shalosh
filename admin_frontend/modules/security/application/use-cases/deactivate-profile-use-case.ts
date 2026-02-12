import { MissingSecuritySessionError } from "../../domain/errors/security-errors";
import type { Profile } from "../../domain/entities/profile";
import type { SecurityRepository } from "../../domain/repositories/security-repository";
import type { SecurityTokenProvider } from "../ports/security-token-provider";

export class DeactivateProfileUseCase {
  constructor(
    private readonly securityRepository: SecurityRepository,
    private readonly tokenProvider: SecurityTokenProvider,
  ) {}

  async execute(profile: Profile): Promise<Profile> {
    const token = this.tokenProvider.getToken().trim();
    if (!token) {
      throw new MissingSecuritySessionError();
    }

    if (!profile.active) {
      return profile;
    }

    return this.securityRepository.updateProfile(token, profile.id, {
      name: profile.name.trim(),
      description: profile.description.trim(),
      active: false,
      permissionIds: [],
    });
  }
}

