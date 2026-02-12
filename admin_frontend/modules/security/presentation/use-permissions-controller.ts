"use client";

import { useEffect, useState } from "react";
import type { ListPermissionsUseCase } from "../application/use-cases/list-permissions-use-case";
import type {
  SavePermissionRequest,
  SavePermissionUseCase,
} from "../application/use-cases/save-permission-use-case";
import type { DeactivatePermissionUseCase } from "../application/use-cases/deactivate-permission-use-case";
import type { Permission } from "../domain/entities/permission";
import { mapSecurityErrorToMessage } from "./map-security-error";

interface PermissionsControllerDependencies {
  listPermissionsUseCase: ListPermissionsUseCase;
  savePermissionUseCase: SavePermissionUseCase;
  deactivatePermissionUseCase: DeactivatePermissionUseCase;
}

interface OperationResult<T> {
  data?: T;
  error?: string;
}

export function usePermissionsController({
  listPermissionsUseCase,
  savePermissionUseCase,
  deactivatePermissionUseCase,
}: PermissionsControllerDependencies) {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    void loadPermissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadPermissions = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const permissionsData = await listPermissionsUseCase.execute();
      setPermissions(permissionsData);
    } catch (cause) {
      setError(
        mapSecurityErrorToMessage(
          cause,
          "Não foi possível carregar as permissões.",
        ),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const savePermission = async (
    request: SavePermissionRequest,
  ): Promise<OperationResult<Permission>> => {
    setIsSaving(true);

    try {
      const savedPermission = await savePermissionUseCase.execute(request);
      setPermissions((currentPermissions) => {
        const exists = currentPermissions.some(
          (permission) => permission.id === savedPermission.id,
        );
        if (exists) {
          return currentPermissions.map((permission) =>
            permission.id === savedPermission.id ? savedPermission : permission,
          );
        }

        return [savedPermission, ...currentPermissions];
      });

      return { data: savedPermission };
    } catch (cause) {
      return {
        error: mapSecurityErrorToMessage(
          cause,
          "Não foi possível salvar a permissão.",
        ),
      };
    } finally {
      setIsSaving(false);
    }
  };

  const deactivatePermission = async (
    permission: Permission,
  ): Promise<OperationResult<Permission>> => {
    setIsUpdatingStatus(true);
    setError(null);

    try {
      const updatedPermission = await deactivatePermissionUseCase.execute(permission);
      setPermissions((currentPermissions) =>
        currentPermissions.map((currentPermission) =>
          currentPermission.id === updatedPermission.id
            ? updatedPermission
            : currentPermission,
        ),
      );

      return { data: updatedPermission };
    } catch (cause) {
      const message = mapSecurityErrorToMessage(
        cause,
        "Não foi possível desativar a permissão.",
      );
      setError(message);
      return { error: message };
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return {
    permissions,
    isLoading,
    error,
    isSaving,
    isUpdatingStatus,
    savePermission,
    deactivatePermission,
    reload: loadPermissions,
  };
}

