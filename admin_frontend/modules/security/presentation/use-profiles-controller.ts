"use client";

import { useEffect, useState } from "react";
import type { DeactivateProfileUseCase } from "../application/use-cases/deactivate-profile-use-case";
import type { GetCurrentUserSecurityContextUseCase } from "../application/use-cases/get-current-user-security-context-use-case";
import type { GetProfilePermissionIdsUseCase } from "../application/use-cases/get-profile-permission-ids-use-case";
import type { ListPermissionOptionsUseCase } from "../application/use-cases/list-permission-options-use-case";
import type { ListProfilesUseCase } from "../application/use-cases/list-profiles-use-case";
import type {
  SaveProfileRequest,
  SaveProfileUseCase,
} from "../application/use-cases/save-profile-use-case";
import type { PermissionOption } from "../domain/entities/permission-option";
import type { Profile } from "../domain/entities/profile";
import { mapSecurityErrorToMessage } from "./map-security-error";

interface ProfilesControllerDependencies {
  listProfilesUseCase: ListProfilesUseCase;
  getCurrentUserSecurityContextUseCase: GetCurrentUserSecurityContextUseCase;
  listPermissionOptionsUseCase: ListPermissionOptionsUseCase;
  getProfilePermissionIdsUseCase: GetProfilePermissionIdsUseCase;
  saveProfileUseCase: SaveProfileUseCase;
  deactivateProfileUseCase: DeactivateProfileUseCase;
}

interface OperationResult<T> {
  data?: T;
  error?: string;
}

export function useProfilesController({
  listProfilesUseCase,
  getCurrentUserSecurityContextUseCase,
  listPermissionOptionsUseCase,
  getProfilePermissionIdsUseCase,
  saveProfileUseCase,
  deactivateProfileUseCase,
}: ProfilesControllerDependencies) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [permissionOptions, setPermissionOptions] = useState<PermissionOption[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isCurrentUserAdministrator, setIsCurrentUserAdministrator] =
    useState(false);

  useEffect(() => {
    void loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadInitialData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [profilesData, optionsData, currentUserSecurityContext] = await Promise.all([
        listProfilesUseCase.execute(),
        listPermissionOptionsUseCase.execute(),
        getCurrentUserSecurityContextUseCase.execute(),
      ]);
      setProfiles(profilesData);
      setPermissionOptions(optionsData);
      setIsCurrentUserAdministrator(
        Boolean(currentUserSecurityContext.isAdministrator),
      );
    } catch (cause) {
      setError(mapSecurityErrorToMessage(cause, "Não foi possível carregar os perfis."));
      setIsCurrentUserAdministrator(false);
    } finally {
      setIsLoading(false);
    }
  };

  const loadProfilePermissionIds = async (
    profileId: string,
  ): Promise<OperationResult<string[]>> => {
    setIsLoadingAssignments(true);

    try {
      const permissionIds = await getProfilePermissionIdsUseCase.execute(profileId);
      return { data: permissionIds };
    } catch (cause) {
      return {
        error: mapSecurityErrorToMessage(
          cause,
          "Não foi possível carregar permissões do perfil.",
        ),
      };
    } finally {
      setIsLoadingAssignments(false);
    }
  };

  const saveProfile = async (
    request: SaveProfileRequest,
  ): Promise<OperationResult<Profile>> => {
    setIsSaving(true);

    try {
      const savedProfile = await saveProfileUseCase.execute(request);
      setProfiles((currentProfiles) => {
        const exists = currentProfiles.some(
          (profile) => profile.id === savedProfile.id,
        );
        if (exists) {
          return currentProfiles.map((profile) =>
            profile.id === savedProfile.id ? savedProfile : profile,
          );
        }

        return [savedProfile, ...currentProfiles];
      });
      return { data: savedProfile };
    } catch (cause) {
      return {
        error: mapSecurityErrorToMessage(cause, "Não foi possível salvar o perfil."),
      };
    } finally {
      setIsSaving(false);
    }
  };

  const deactivateProfile = async (
    profile: Profile,
  ): Promise<OperationResult<Profile>> => {
    setIsUpdatingStatus(true);
    setError(null);

    try {
      const updatedProfile = await deactivateProfileUseCase.execute(profile);
      setProfiles((currentProfiles) =>
        currentProfiles.map((currentProfile) =>
          currentProfile.id === updatedProfile.id
            ? updatedProfile
            : currentProfile,
        ),
      );
      return { data: updatedProfile };
    } catch (cause) {
      const message = mapSecurityErrorToMessage(
        cause,
        "Não foi possível desativar o perfil.",
      );
      setError(message);
      return { error: message };
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return {
    profiles,
    permissionOptions,
    isLoading,
    isLoadingAssignments,
    error,
    isSaving,
    isUpdatingStatus,
    isCurrentUserAdministrator,
    loadProfilePermissionIds,
    saveProfile,
    deactivateProfile,
    reload: loadInitialData,
  };
}
