"use client";

import { Button } from "@heroui/button";
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@heroui/dropdown";
import { Input } from "@heroui/input";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/modal";
import { FormEvent, useMemo, useState } from "react";

import { MaterialSymbol } from "@/components/material-symbol";
import { createProfilesControllerDependencies } from "@/modules/security/composition/create-profiles-controller-deps";
import type { PermissionOption } from "@/modules/security/domain/entities/permission-option";
import type { Profile } from "@/modules/security/domain/entities/profile";
import { useProfilesController } from "@/modules/security/presentation/use-profiles-controller";

export default function ProfilesPage() {
  const controllerDependencies = useMemo(
    () => createProfilesControllerDependencies(),
    [],
  );
  const {
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
  } = useProfilesController(controllerDependencies);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [viewingProfile, setViewingProfile] = useState<Profile | null>(null);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formActive, setFormActive] = useState(true);
  const [selectedPermissionIDs, setSelectedPermissionIDs] = useState<string[]>(
    [],
  );
  const [permissionSearchText, setPermissionSearchText] = useState("");
  const [permissionSearchQuery, setPermissionSearchQuery] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const totalProfiles = useMemo(() => profiles.length, [profiles.length]);
  const filteredPermissions = useMemo(() => {
    const normalizedQuery = permissionSearchQuery.trim().toLowerCase();
    if (!normalizedQuery) {
      return permissionOptions;
    }

    return permissionOptions.filter((permission) => {
      const name = permission.name.toLowerCase();
      const code = permission.code.toLowerCase();
      return (
        name.includes(normalizedQuery) || code.includes(normalizedQuery)
      );
    });
  }, [permissionSearchQuery, permissionOptions]);

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProfile(null);
    setFormName("");
    setFormDescription("");
    setFormActive(true);
    setSelectedPermissionIDs([]);
    setPermissionSearchText("");
    setPermissionSearchQuery("");
    setFormError(null);
  };

  const openCreateModal = () => {
    setEditingProfile(null);
    setFormName("");
    setFormDescription("");
    setFormActive(true);
    setSelectedPermissionIDs([]);
    setPermissionSearchText("");
    setPermissionSearchQuery("");
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = async (profile: Profile) => {
    setEditingProfile(profile);
    setFormName(profile.name || "");
    setFormDescription(profile.description || "");
    setFormActive(Boolean(profile.active));
    setSelectedPermissionIDs([]);
    setPermissionSearchText("");
    setPermissionSearchQuery("");
    setFormError(null);
    setIsModalOpen(true);

    const result = await loadProfilePermissionIds(profile.id);
    if (result.error) {
      setFormError(result.error);
      return;
    }

    setSelectedPermissionIDs(result.data || []);
  };

  const togglePermissionSelection = (permissionID: string) => {
    setSelectedPermissionIDs((currentIDs) =>
      currentIDs.includes(permissionID)
        ? currentIDs.filter((currentID) => currentID !== permissionID)
        : [...currentIDs, permissionID],
    );
  };

  const applyPermissionSearch = () => {
    setPermissionSearchQuery(permissionSearchText.trim());
  };

  const deactivateProfileFromList = async (profile: Profile) => {
    const result = await deactivateProfile(profile);
    if (result.data && viewingProfile?.id === result.data.id) {
      setViewingProfile(result.data);
    }
  };

  const handleProfileMenuAction = (
    profile: Profile,
    action: string | number,
  ) => {
    const selectedAction = String(action);

    if (selectedAction === "view") {
      setViewingProfile(profile);
      return;
    }

    if (selectedAction === "edit") {
      if (!isCurrentUserAdministrator) {
        return;
      }
      void openEditModal(profile);
      return;
    }

    if (selectedAction === "deactivate") {
      if (!isCurrentUserAdministrator) {
        return;
      }
      void deactivateProfileFromList(profile);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedName = formName.trim();
    const normalizedDescription = formDescription.trim();
    if (!normalizedName) {
      setFormError("Nome do perfil é obrigatório.");
      return;
    }

    setFormError(null);

    const result = await saveProfile({
      profileId: editingProfile?.id,
      name: normalizedName,
      description: normalizedDescription,
      active: formActive,
      permissionIds: selectedPermissionIDs,
    });

    if (result.error) {
      setFormError(result.error);
      return;
    }

    if (result.data && viewingProfile?.id === result.data.id) {
      setViewingProfile(result.data);
    }

    closeModal();
  };

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-default-200 bg-content1/70 p-6 backdrop-blur-md">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-foreground/60">
              <MaterialSymbol name="security" className="text-[16px]" />
              Segurança
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-foreground">
              Perfis
            </h1>
            <p className="mt-2 text-sm text-foreground/80">
              Cadastre e edite perfis, vinculando várias permissões para cada
              perfil.
            </p>
            <p className="mt-2 text-sm font-medium text-foreground/80">
              Total de perfis: {totalProfiles}
            </p>
          </div>

          <Button
            color="primary"
            startContent={<MaterialSymbol name="add" className="text-[18px]" />}
            onPress={openCreateModal}
          >
            Novo perfil
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-default-200 bg-content1/70 backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-content1/70">
              <tr className="border-b border-default-200">
                <th className="px-4 py-3 font-semibold text-foreground/80">
                  Nome
                </th>
                <th className="px-4 py-3 font-semibold text-foreground/80">
                  Descrição
                </th>
                <th className="px-4 py-3 font-semibold text-foreground/80">
                  Permissões
                </th>
                <th className="px-4 py-3 font-semibold text-foreground/80">
                  Status
                </th>
                <th className="px-4 py-3 font-semibold text-foreground/80">
                  Atualizado em
                </th>
                <th className="px-4 py-3 text-right font-semibold text-foreground/80">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td className="px-4 py-6 text-foreground/70" colSpan={6}>
                    Carregando perfis...
                  </td>
                </tr>
              ) : null}

              {!isLoading && error ? (
                <tr>
                  <td className="px-4 py-6 text-danger" colSpan={6}>
                    {error}
                  </td>
                </tr>
              ) : null}

              {!isLoading && !error && profiles.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-foreground/70" colSpan={6}>
                    Nenhum perfil cadastrado.
                  </td>
                </tr>
              ) : null}

              {!isLoading && !error
                ? profiles.map((profile) => (
                    <tr
                      key={profile.id}
                      className="border-b border-default-200/70 last:border-b-0"
                    >
                      <td className="px-4 py-3 text-foreground">
                        {profile.name || "-"}
                      </td>
                      <td className="px-4 py-3 text-foreground/80">
                        {profile.description || "-"}
                      </td>
                      <td className="px-4 py-3 text-foreground/90">
                        {profile.permissionCount || 0}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            profile.active
                              ? "rounded-full border border-success/40 bg-success/10 px-2.5 py-1 text-xs font-medium text-success"
                              : "rounded-full border border-danger/40 bg-danger/10 px-2.5 py-1 text-xs font-medium text-danger"
                          }
                        >
                          {profile.active ? "Ativo" : "Inativo"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-foreground/80">
                        {formatDateTime(profile.updated)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Dropdown placement="bottom-end">
                          <DropdownTrigger>
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                              aria-label={`Abrir ações do perfil ${profile.name}`}
                            >
                              <MaterialSymbol name="more_vert" className="text-[20px]" />
                            </Button>
                          </DropdownTrigger>
                          <DropdownMenu
                            aria-label={`Ações do perfil ${profile.name}`}
                            onAction={(key) => handleProfileMenuAction(profile, key)}
                          >
                            <DropdownItem
                              key="view"
                              startContent={
                                <MaterialSymbol
                                  name="visibility"
                                  className="text-[18px]"
                                />
                              }
                            >
                              Visualizar
                            </DropdownItem>
                            <DropdownItem
                              key="edit"
                              isDisabled={!isCurrentUserAdministrator}
                              startContent={
                                <MaterialSymbol name="edit" className="text-[18px]" />
                              }
                            >
                              Editar
                            </DropdownItem>
                            <DropdownItem
                              key="deactivate"
                              className="text-warning"
                              color="warning"
                              isDisabled={
                                !isCurrentUserAdministrator ||
                                !profile.active ||
                                isUpdatingStatus
                              }
                              startContent={
                                <MaterialSymbol
                                  name="toggle_off"
                                  className="text-[18px]"
                                />
                              }
                            >
                              Desativar
                            </DropdownItem>
                          </DropdownMenu>
                        </Dropdown>
                      </td>
                    </tr>
                  ))
                : null}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={Boolean(viewingProfile)}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setViewingProfile(null);
          }
        }}
        placement="center"
        size="2xl"
      >
        <ModalContent>
          {(closeViewModal) => (
            <>
              <ModalHeader>
                <span className="inline-flex items-center gap-2">
                  <MaterialSymbol
                    name="visibility"
                    className="text-[20px] text-primary"
                  />
                  Visualizar perfil
                </span>
              </ModalHeader>
              <ModalBody className="gap-3">
                <div className="grid gap-3 md:grid-cols-2">
                  <InfoField label="ID" value={viewingProfile?.id} />
                  <InfoField label="Nome" value={viewingProfile?.name} />
                </div>
                <InfoField
                  label="Descrição"
                  value={viewingProfile?.description || "-"}
                />
                <div className="grid gap-3 md:grid-cols-3">
                  <InfoField
                    label="Permissões"
                    value={String(viewingProfile?.permissionCount || 0)}
                  />
                  <InfoField
                    label="Status"
                    value={viewingProfile?.active ? "Ativo" : "Inativo"}
                  />
                  <InfoField
                    label="Atualizado em"
                    value={formatDateTime(viewingProfile?.updated)}
                  />
                </div>
                <InfoField
                  label="Criado em"
                  value={formatDateTime(viewingProfile?.created)}
                />
              </ModalBody>
              <ModalFooter>
                <Button
                  variant="light"
                  startContent={
                    <MaterialSymbol name="close" className="text-[18px]" />
                  }
                  onPress={closeViewModal}
                >
                  Fechar
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      <Modal
        isOpen={isModalOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            closeModal();
          }
        }}
        placement="center"
        size="3xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          {(closeProfileModal) => (
            <form onSubmit={handleSubmit}>
              <ModalHeader>
                <span className="inline-flex items-center gap-2">
                  <MaterialSymbol
                    name={editingProfile ? "edit" : "add"}
                    className="text-[20px] text-primary"
                  />
                  {editingProfile ? "Editar perfil" : "Novo perfil"}
                </span>
              </ModalHeader>
              <ModalBody className="gap-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <Input
                    label="Nome"
                    value={formName}
                    onValueChange={setFormName}
                    placeholder="Ex: Administrador"
                    isRequired
                  />
                  <Input
                    label="Descrição"
                    value={formDescription}
                    onValueChange={setFormDescription}
                    placeholder="Descrição do perfil"
                  />
                </div>

                <label className="flex items-center gap-2 text-sm text-foreground/80">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-default-300"
                    checked={formActive}
                    onChange={(event) => setFormActive(event.target.checked)}
                  />
                  Perfil ativo
                </label>

                <div className="rounded-xl border border-default-200 bg-default-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/60">
                    Permissões do perfil
                  </p>

                  <div className="mt-3 flex items-center gap-2">
                    <input
                      type="text"
                      className="w-full rounded-lg border border-default-300 bg-content1 px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
                      placeholder="Buscar permissão por nome ou código"
                      value={permissionSearchText}
                      onChange={(event) =>
                        setPermissionSearchText(event.target.value)
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          applyPermissionSearch();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      isIconOnly
                      size="sm"
                      variant="flat"
                      color="default"
                      aria-label="Buscar permissões"
                      onPress={applyPermissionSearch}
                    >
                      <MaterialSymbol name="search" className="text-[18px]" />
                    </Button>
                  </div>

                  {isLoadingAssignments ? (
                    <p className="mt-3 text-sm text-foreground/70">
                      Carregando permissões vinculadas...
                    </p>
                  ) : permissionOptions.length === 0 ? (
                    <p className="mt-3 text-sm text-foreground/70">
                      Nenhuma permissão disponível para vínculo.
                    </p>
                  ) : filteredPermissions.length === 0 ? (
                    <p className="mt-3 text-sm text-foreground/70">
                      Nenhuma permissão encontrada para a busca.
                    </p>
                  ) : (
                    <div className="mt-3 max-h-56 space-y-2 overflow-y-auto pr-1">
                      {filteredPermissions.map((permission) => {
                        const isSelected = selectedPermissionIDs.includes(
                          permission.id,
                        );
                        return (
                          <label
                            key={permission.id}
                            className="flex items-center justify-between gap-3 rounded-lg border border-default-200 bg-content1/70 px-3 py-2 text-sm"
                          >
                            <span className="min-w-0">
                              <span className="block truncate text-foreground">
                                {permission.name}
                              </span>
                              <span className="block truncate text-xs text-foreground/70">
                                {permission.code}
                              </span>
                            </span>
                            <input
                              type="checkbox"
                              className="h-4 w-4 shrink-0 rounded border-default-300"
                              checked={isSelected}
                              onChange={() =>
                                togglePermissionSelection(permission.id)
                              }
                              disabled={!permission.active}
                              title={
                                permission.active
                                  ? "Selecionar permissão"
                                  : "Permissão inativa"
                              }
                            />
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                {formError ? (
                  <p className="text-sm font-medium text-danger">{formError}</p>
                ) : null}
              </ModalBody>
              <ModalFooter>
                <Button
                  variant="light"
                  startContent={
                    <MaterialSymbol name="close" className="text-[18px]" />
                  }
                  onPress={() => {
                    closeModal();
                    closeProfileModal();
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  color="primary"
                  type="submit"
                  isLoading={isSaving}
                  startContent={
                    isSaving ? null : (
                      <MaterialSymbol name="save" className="text-[18px]" />
                    )
                  }
                >
                  Salvar
                </Button>
              </ModalFooter>
            </form>
          )}
        </ModalContent>
      </Modal>
    </section>
  );
}

function InfoField({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-lg border border-default-200 bg-default-50 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground/60">
        {label}
      </p>
      <p className="mt-1 text-sm text-foreground">{value || "-"}</p>
    </div>
  );
}

function formatDateTime(value?: string): string {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}
