import type { Permission } from "../entities/permission";
import type { PermissionOption } from "../entities/permission-option";
import type { Profile } from "../entities/profile";

export interface SavePermissionInput {
  code: string;
  name: string;
  description: string;
  active: boolean;
}

export interface CurrentUserSecurityContext {
  isAdministrator: boolean;
}

export interface SaveProfileInput {
  name: string;
  description: string;
  active: boolean;
  permissionIds: string[];
}

export interface SecurityRepository {
  getCurrentUserSecurityContext(
    token: string,
  ): Promise<CurrentUserSecurityContext>;

  listPermissions(token: string): Promise<Permission[]>;
  createPermission(
    token: string,
    input: SavePermissionInput,
  ): Promise<Permission>;
  updatePermission(
    token: string,
    permissionId: string,
    input: SavePermissionInput,
  ): Promise<Permission>;

  listProfiles(token: string): Promise<Profile[]>;
  createProfile(token: string, input: SaveProfileInput): Promise<Profile>;
  updateProfile(
    token: string,
    profileId: string,
    input: SaveProfileInput,
  ): Promise<Profile>;

  listPermissionOptions(token: string): Promise<PermissionOption[]>;
  getProfilePermissionIds(token: string, profileId: string): Promise<string[]>;
  replaceProfilePermissions(
    token: string,
    profileId: string,
    permissionIds: string[],
  ): Promise<void>;
}
