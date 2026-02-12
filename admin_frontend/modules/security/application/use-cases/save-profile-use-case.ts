import { MissingSecuritySessionError } from "../../domain/errors/security-errors";
import type { Profile } from "../../domain/entities/profile";
import type {
  SaveProfileInput,
  SecurityRepository,
} from "../../domain/repositories/security-repository";
import type { SecurityTokenProvider } from "../ports/security-token-provider";

export interface SaveProfileRequest extends SaveProfileInput {
  profileId?: string;
}

export class SaveProfileUseCase {
  constructor(
    private readonly securityRepository: SecurityRepository,
    private readonly tokenProvider: SecurityTokenProvider,
  ) {}

  async execute(request: SaveProfileRequest): Promise<Profile> {
    const token = this.tokenProvider.getToken().trim();
    if (!token) {
      throw new MissingSecuritySessionError();
    }

    const input: SaveProfileInput = {
      name: request.name.trim(),
      description: request.description.trim(),
      active: Boolean(request.active),
      permissionIds: normalizePermissionIds(request.permissionIds),
    };

    if (request.profileId) {
      const updatedProfile = await this.securityRepository.updateProfile(
        token,
        request.profileId,
        input,
      );
      await this.securityRepository.replaceProfilePermissions(
        token,
        updatedProfile.id,
        input.permissionIds,
      );
      return {
        ...updatedProfile,
        permissionCount: input.permissionIds.length,
      };
    }

    const createdProfile = await this.securityRepository.createProfile(token, input);
    await this.securityRepository.replaceProfilePermissions(
      token,
      createdProfile.id,
      input.permissionIds,
    );
    return {
      ...createdProfile,
      permissionCount: input.permissionIds.length,
    };
  }
}

function normalizePermissionIds(values: string[]): string[] {
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const value of values) {
    const id = value.trim();
    if (!id || seen.has(id)) {
      continue;
    }
    seen.add(id);
    normalized.push(id);
  }

  return normalized;
}

