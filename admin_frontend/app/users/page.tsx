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
import { FormEvent, useEffect, useMemo, useState } from "react";

import { MaterialSymbol } from "@/components/material-symbol";
import { adminBackendUrl } from "@/config/api";

interface SystemUser {
  id: string;
  name: string;
  email: string;
  login: string;
  phone?: string;
  address?: string;
  avatar?: string;
  active: boolean;
  created?: string;
  updated?: string;
}

interface ProfileOption {
  id: string;
  name: string;
  description?: string;
  active: boolean;
}

interface MyProfilesResponse {
  userId: string;
  isAdministrator: boolean;
  profileIds: string[];
  profiles: ProfileOption[];
}

interface UserProfilesResponse {
  userId: string;
  profileIds: string[];
}

interface ApiError {
  error?: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewingUser, setViewingUser] = useState<SystemUser | null>(null);
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);
  const [editPassword, setEditPassword] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [pendingDeactivateUser, setPendingDeactivateUser] =
    useState<SystemUser | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isCurrentUserAdministrator, setIsCurrentUserAdministrator] =
    useState(false);
  const [availableProfiles, setAvailableProfiles] = useState<ProfileOption[]>(
    [],
  );
  const [selectedProfileID, setSelectedProfileID] = useState("");
  const [isLoadingUserProfiles, setIsLoadingUserProfiles] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      const token = readTokenFromCookie();
      if (!token) {
        setError("Sessão inválida. Faça login novamente.");
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`${adminBackendUrl}/users`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const payload = (await response.json()) as SystemUser[] | ApiError;
        if (!response.ok) {
          const message =
            !Array.isArray(payload) && payload.error
              ? payload.error
              : "Não foi possível carregar os usuários.";
          setError(message);
          setIsLoading(false);
          return;
        }

        const normalizedUsers = Array.isArray(payload) ? payload : [];
        setUsers(normalizedUsers);
        await loadCurrentUserSecurityContext(token);
      } catch {
        setError("Falha de conexão com o backend.");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchUsers();
  }, []);

  const totalUsers = useMemo(() => users.length, [users.length]);

  const mergeUserInList = (updatedUser: SystemUser) => {
    setUsers((currentUsers) =>
      currentUsers.map((currentUser) =>
        currentUser.id === updatedUser.id
          ? { ...currentUser, ...updatedUser }
          : currentUser,
      ),
    );
  };

  const updateUserOnBackend = async (
    user: SystemUser,
    password?: string,
  ): Promise<{ user?: SystemUser; error?: string }> => {
    const token = readTokenFromCookie();
    if (!token) {
      return { error: "Sessão inválida. Faça login novamente." };
    }

    try {
      const response = await fetch(`${adminBackendUrl}/users/${user.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: user.name,
          email: user.email,
          login: user.login,
          password: password || "",
          phone: user.phone || "",
          address: user.address || "",
          avatar: user.avatar || "",
          active: Boolean(user.active),
        }),
      });

      const payload = (await response.json()) as SystemUser | ApiError;
      if (!response.ok) {
        const message =
          !Array.isArray(payload) && "error" in payload && payload.error
            ? payload.error
            : "Não foi possível atualizar o usuário.";
        return { error: message };
      }

      if (Array.isArray(payload) || !("id" in payload) || !payload.id) {
        return { error: "Resposta inválida do backend." };
      }

      return {
        user: {
          id: payload.id,
          name: payload.name || "",
          email: payload.email || "",
          login: payload.login || "",
          phone: payload.phone || "",
          address: payload.address || "",
          avatar: payload.avatar || "",
          active: Boolean(payload.active),
          created: payload.created,
          updated: payload.updated,
        },
      };
    } catch {
      return { error: "Falha de conexão com o backend." };
    }
  };

  const loadCurrentUserSecurityContext = async (token: string) => {
    try {
      const contextResponse = await fetch(`${adminBackendUrl}/auth/me/profiles`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const contextPayload = (await contextResponse.json()) as
        | MyProfilesResponse
        | ApiError;

      if (!contextResponse.ok) {
        setIsCurrentUserAdministrator(false);
        setAvailableProfiles([]);
        return;
      }

      if (
        Array.isArray(contextPayload) ||
        !("isAdministrator" in contextPayload)
      ) {
        setIsCurrentUserAdministrator(false);
        setAvailableProfiles([]);
        return;
      }

      const isAdministrator = Boolean(contextPayload.isAdministrator);
      setIsCurrentUserAdministrator(isAdministrator);

      if (!isAdministrator) {
        setAvailableProfiles([]);
        return;
      }

      const profilesResponse = await fetch(`${adminBackendUrl}/profiles`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const profilesPayload = (await profilesResponse.json()) as
        | ProfileOption[]
        | ApiError;

      if (!profilesResponse.ok || !Array.isArray(profilesPayload)) {
        setAvailableProfiles([]);
        return;
      }

      setAvailableProfiles(
        profilesPayload.map((profile) => ({
          id: profile.id,
          name: profile.name,
          description: profile.description || "",
          active: Boolean(profile.active),
        })),
      );
    } catch {
      setIsCurrentUserAdministrator(false);
      setAvailableProfiles([]);
    }
  };

  const loadUserProfilesForEdit = async (userID: string) => {
    const token = readTokenFromCookie();
    if (!token) {
      setEditError("Sessão inválida. Faça login novamente.");
      return;
    }

    setIsLoadingUserProfiles(true);
    setEditError(null);

    try {
      const response = await fetch(`${adminBackendUrl}/users/${userID}/profiles`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const payload = (await response.json()) as UserProfilesResponse | ApiError;

      if (!response.ok) {
        const message =
          !Array.isArray(payload) && "error" in payload && payload.error
            ? payload.error
            : "Não foi possível carregar o perfil do usuário.";
        setEditError(message);
        setSelectedProfileID("");
        return;
      }

      if (Array.isArray(payload) || !("profileIds" in payload)) {
        setEditError("Resposta inválida do backend.");
        setSelectedProfileID("");
        return;
      }

      setSelectedProfileID(payload.profileIds?.[0] || "");
    } catch {
      setEditError("Falha de conexão com o backend.");
      setSelectedProfileID("");
    } finally {
      setIsLoadingUserProfiles(false);
    }
  };

  const updateUserProfilesOnBackend = async (
    userID: string,
    profileID: string,
  ): Promise<{ error?: string }> => {
    const token = readTokenFromCookie();
    if (!token) {
      return { error: "Sessão inválida. Faça login novamente." };
    }

    try {
      const response = await fetch(`${adminBackendUrl}/users/${userID}/profiles`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          profileIds: profileID ? [profileID] : [],
        }),
      });

      const payload = (await response.json()) as UserProfilesResponse | ApiError;
      if (!response.ok) {
        const message =
          !Array.isArray(payload) && "error" in payload && payload.error
            ? payload.error
            : "Não foi possível atualizar o perfil do usuário.";
        return { error: message };
      }

      return {};
    } catch {
      return { error: "Falha de conexão com o backend." };
    }
  };

  const activateUser = async (user: SystemUser) => {
    setIsUpdatingStatus(true);
    const result = await updateUserOnBackend({ ...user, active: true });
    setIsUpdatingStatus(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    if (result.user) {
      mergeUserInList(result.user);
      if (viewingUser?.id === result.user.id) {
        setViewingUser(result.user);
      }
    }
  };

  const handleUserMenuAction = (user: SystemUser, action: string | number) => {
    const selectedAction = String(action);

    if (selectedAction === "view") {
      setViewingUser(user);
      return;
    }

    if (selectedAction === "edit") {
      setEditingUser({
        ...user,
        phone: user.phone || "",
        address: user.address || "",
        avatar: user.avatar || "",
      });
      setSelectedProfileID("");
      setIsLoadingUserProfiles(false);
      setEditPassword("");
      setEditError(null);

      if (isCurrentUserAdministrator) {
        void loadUserProfilesForEdit(user.id);
      }
      return;
    }

    if (selectedAction !== "toggle") {
      return;
    }

    if (user.active) {
      setPendingDeactivateUser(user);
      return;
    }

    void activateUser(user);
  };

  const handleEditSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!editingUser) {
      return;
    }

    const normalizedUser: SystemUser = {
      ...editingUser,
      name: editingUser.name.trim(),
      email: editingUser.email.trim(),
      login: editingUser.login.trim(),
      phone: (editingUser.phone || "").trim(),
      address: (editingUser.address || "").trim(),
      avatar: editingUser.avatar || "",
      active: Boolean(editingUser.active),
    };

    if (!normalizedUser.name || !normalizedUser.email || !normalizedUser.login) {
      setEditError("Nome, email e login são obrigatórios.");
      return;
    }

    setIsSavingEdit(true);
    setEditError(null);

    const result = await updateUserOnBackend(
      normalizedUser,
      editPassword.trim() || undefined,
    );

    setIsSavingEdit(false);

    if (result.error) {
      setEditError(result.error);
      return;
    }

    if (!result.user) {
      setEditError("Não foi possível atualizar o usuário.");
      return;
    }

    if (isCurrentUserAdministrator) {
      const profileResult = await updateUserProfilesOnBackend(
        result.user.id,
        selectedProfileID,
      );
      if (profileResult.error) {
        mergeUserInList(result.user);
        if (viewingUser?.id === result.user.id) {
          setViewingUser(result.user);
        }
        setEditingUser(result.user);
        setEditError(`${profileResult.error} Os dados básicos foram salvos.`);
        return;
      }
    }

    mergeUserInList(result.user);
    if (viewingUser?.id === result.user.id) {
      setViewingUser(result.user);
    }
    setEditingUser(null);
    setSelectedProfileID("");
    setIsLoadingUserProfiles(false);
    setEditPassword("");
    setEditError(null);
  };

  const confirmDeactivateUser = async () => {
    if (!pendingDeactivateUser) {
      return;
    }

    setIsUpdatingStatus(true);
    const result = await updateUserOnBackend({
      ...pendingDeactivateUser,
      active: false,
    });
    setIsUpdatingStatus(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    if (result.user) {
      mergeUserInList(result.user);
      if (viewingUser?.id === result.user.id) {
        setViewingUser(result.user);
      }
    }

    setPendingDeactivateUser(null);
  };

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-default-200 bg-content1/70 p-6 backdrop-blur-md">
        <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-foreground/60">
          <MaterialSymbol name="person" className="text-[16px]" />
          Usuários
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-foreground">
          Gestão de Usuários
        </h1>
        <p className="mt-2 text-sm text-foreground/80">
          Visualize os usuários do sistema e seus avatares.
        </p>
        <p className="mt-3 text-sm font-medium text-foreground/80">
          Total de usuários: {totalUsers}
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-default-200 bg-content1/70 backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-content1/70">
              <tr className="border-b border-default-200">
                <th className="px-4 py-3 font-semibold text-foreground/80">
                  Avatar
                </th>
                <th className="px-4 py-3 font-semibold text-foreground/80">
                  Nome
                </th>
                <th className="px-4 py-3 font-semibold text-foreground/80">
                  Login
                </th>
                <th className="px-4 py-3 font-semibold text-foreground/80">
                  Email
                </th>
                <th className="px-4 py-3 font-semibold text-foreground/80">
                  Telefone
                </th>
                <th className="px-4 py-3 font-semibold text-foreground/80">
                  Endereço
                </th>
                <th className="px-4 py-3 font-semibold text-foreground/80">
                  Status
                </th>
                <th className="px-4 py-3 font-semibold text-foreground/80">
                  Criado em
                </th>
                <th className="px-4 py-3 text-right font-semibold text-foreground/80">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    className="px-4 py-6 text-foreground/70"
                    colSpan={9}
                  >
                    Carregando usuários...
                  </td>
                </tr>
              ) : null}

              {!isLoading && error ? (
                <tr>
                  <td className="px-4 py-6 text-danger" colSpan={9}>
                    {error}
                  </td>
                </tr>
              ) : null}

              {!isLoading && !error && users.length === 0 ? (
                <tr>
                  <td
                    className="px-4 py-6 text-foreground/70"
                    colSpan={9}
                  >
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              ) : null}

              {!isLoading && !error
                ? users.map((user) => (
                    <tr key={user.id} className="border-b border-default-200/70 last:border-b-0">
                      <td className="px-4 py-3">
                        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-default-200 bg-default-100 text-sm font-semibold text-black dark:text-white">
                          {user.avatar ? (
                            <img
                              src={user.avatar}
                              alt={`Avatar de ${user.login}`}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            getUserInitial(user.name, user.login)
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-foreground">
                        {user.name || "-"}
                      </td>
                      <td className="px-4 py-3 text-foreground/90">
                        {user.login || "-"}
                      </td>
                      <td className="px-4 py-3 text-foreground/90">
                        {user.email || "-"}
                      </td>
                      <td className="px-4 py-3 text-foreground/80">
                        {user.phone || "-"}
                      </td>
                      <td className="px-4 py-3 text-foreground/80">
                        {user.address || "-"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            user.active
                              ? "rounded-full border border-success/40 bg-success/10 px-2.5 py-1 text-xs font-medium text-success"
                              : "rounded-full border border-danger/40 bg-danger/10 px-2.5 py-1 text-xs font-medium text-danger"
                          }
                        >
                          {user.active ? "Ativo" : "Inativo"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-foreground/80">
                        {formatDateTime(user.created)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Dropdown placement="bottom-end">
                          <DropdownTrigger>
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                              aria-label={`Abrir ações de ${user.login}`}
                            >
                              <MaterialSymbol name="more_vert" className="text-[20px]" />
                            </Button>
                          </DropdownTrigger>
                          <DropdownMenu
                            aria-label={`Ações do usuário ${user.login}`}
                            onAction={(key) => handleUserMenuAction(user, key)}
                          >
                            <DropdownItem
                              key="view"
                              startContent={
                                <MaterialSymbol name="visibility" className="text-[18px]" />
                              }
                            >
                              Visualizar
                            </DropdownItem>
                            <DropdownItem
                              key="edit"
                              startContent={
                                <MaterialSymbol name="edit" className="text-[18px]" />
                              }
                            >
                              Editar
                            </DropdownItem>
                            <DropdownItem
                              key="toggle"
                              className={user.active ? "text-warning" : "text-success"}
                              color={user.active ? "warning" : "success"}
                              startContent={
                                <MaterialSymbol
                                  name={user.active ? "toggle_off" : "toggle_on"}
                                  className="text-[18px]"
                                />
                              }
                            >
                              {user.active ? "Desativar" : "Ativar"}
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
        isOpen={Boolean(viewingUser)}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setViewingUser(null);
          }
        }}
        placement="center"
        size="2xl"
      >
        <ModalContent>
          {(closeModal) => (
            <>
              <ModalHeader>
                <span className="inline-flex items-center gap-2">
                  <MaterialSymbol name="visibility" className="text-[20px] text-primary" />
                  Visualizar usuário
                </span>
              </ModalHeader>
              <ModalBody className="gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border border-default-200 bg-default-100 text-lg font-semibold text-black dark:text-white">
                    {viewingUser?.avatar ? (
                      <img
                        src={viewingUser.avatar}
                        alt={`Avatar de ${viewingUser.login}`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      getUserInitial(viewingUser?.name, viewingUser?.login)
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {viewingUser?.name || "-"}
                    </p>
                    <p className="text-xs text-foreground/70">
                      {viewingUser?.email || "-"}
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <InfoField label="ID" value={viewingUser?.id} />
                  <InfoField label="Login" value={viewingUser?.login} />
                  <InfoField label="Telefone" value={viewingUser?.phone} />
                  <InfoField label="Status" value={viewingUser?.active ? "Ativo" : "Inativo"} />
                </div>

                <InfoField label="Endereço" value={viewingUser?.address} />
                <div className="grid gap-3 md:grid-cols-2">
                  <InfoField
                    label="Criado em"
                    value={formatDateTime(viewingUser?.created)}
                  />
                  <InfoField
                    label="Atualizado em"
                    value={formatDateTime(viewingUser?.updated)}
                  />
                </div>
              </ModalBody>
              <ModalFooter>
                <Button
                  variant="light"
                  startContent={<MaterialSymbol name="close" className="text-[18px]" />}
                  onPress={closeModal}
                >
                  Fechar
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      <Modal
        isOpen={Boolean(editingUser)}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setEditingUser(null);
            setSelectedProfileID("");
            setIsLoadingUserProfiles(false);
            setEditPassword("");
            setEditError(null);
          }
        }}
        placement="center"
        size="2xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          {(closeModal) => (
            <form onSubmit={handleEditSubmit}>
              <ModalHeader>
                <span className="inline-flex items-center gap-2">
                  <MaterialSymbol name="edit" className="text-[20px] text-primary" />
                  Editar usuário
                </span>
              </ModalHeader>
              <ModalBody className="gap-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <Input
                    label="Nome"
                    value={editingUser?.name || ""}
                    onValueChange={(value) =>
                      setEditingUser((currentUser) =>
                        currentUser ? { ...currentUser, name: value } : currentUser,
                      )
                    }
                    isRequired
                  />
                  <Input
                    label="Email"
                    value={editingUser?.email || ""}
                    onValueChange={(value) =>
                      setEditingUser((currentUser) =>
                        currentUser ? { ...currentUser, email: value } : currentUser,
                      )
                    }
                    type="email"
                    isRequired
                  />
                  <Input
                    label="Login"
                    value={editingUser?.login || ""}
                    onValueChange={(value) =>
                      setEditingUser((currentUser) =>
                        currentUser ? { ...currentUser, login: value } : currentUser,
                      )
                    }
                    isRequired
                  />
                  <Input
                    label="Telefone"
                    value={editingUser?.phone || ""}
                    onValueChange={(value) =>
                      setEditingUser((currentUser) =>
                        currentUser ? { ...currentUser, phone: value } : currentUser,
                      )
                    }
                  />
                </div>

                <Input
                  label="Endereço"
                  value={editingUser?.address || ""}
                  onValueChange={(value) =>
                    setEditingUser((currentUser) =>
                      currentUser ? { ...currentUser, address: value } : currentUser,
                    )
                  }
                />

                <Input
                  label="Nova senha (opcional)"
                  value={editPassword}
                  onValueChange={setEditPassword}
                  type="password"
                  placeholder="Informe para alterar"
                />

                <div className="rounded-xl border border-default-200 bg-default-50 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground/60">
                    Perfil do usuário
                  </p>
                  <div className="mt-2">
                    <select
                      className="w-full rounded-lg border border-default-300 bg-content1 px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary disabled:cursor-not-allowed disabled:opacity-70"
                      value={selectedProfileID}
                      onChange={(event) => setSelectedProfileID(event.target.value)}
                      disabled={
                        !isCurrentUserAdministrator ||
                        isLoadingUserProfiles ||
                        availableProfiles.length === 0
                      }
                    >
                      <option value="">Sem perfil</option>
                      {availableProfiles.map((profile) => (
                        <option key={profile.id} value={profile.id}>
                          {profile.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="mt-2 text-xs text-foreground/70">
                    {isLoadingUserProfiles
                      ? "Carregando perfil atual do usuário..."
                      : isCurrentUserAdministrator
                        ? "Selecione um perfil para o usuário."
                        : "Apenas administradores podem alterar o perfil do usuário."}
                  </p>
                </div>

                <label className="flex items-center gap-2 text-sm text-foreground/80">
                  <MaterialSymbol
                    name={editingUser?.active ? "toggle_on" : "toggle_off"}
                    className="text-[18px]"
                  />
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-default-300"
                    checked={Boolean(editingUser?.active)}
                    onChange={(event) =>
                      setEditingUser((currentUser) =>
                        currentUser
                          ? { ...currentUser, active: event.target.checked }
                          : currentUser,
                      )
                    }
                  />
                  Usuário ativo
                </label>

                {editError ? (
                  <p className="text-sm font-medium text-danger">{editError}</p>
                ) : null}
              </ModalBody>
              <ModalFooter>
                <Button
                  variant="light"
                  startContent={<MaterialSymbol name="close" className="text-[18px]" />}
                  onPress={() => {
                    setEditingUser(null);
                    setSelectedProfileID("");
                    setIsLoadingUserProfiles(false);
                    setEditPassword("");
                    setEditError(null);
                    closeModal();
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  color="primary"
                  type="submit"
                  isLoading={isSavingEdit}
                  startContent={
                    isSavingEdit ? null : (
                      <MaterialSymbol name="save" className="text-[18px]" />
                    )
                  }
                >
                  Salvar alterações
                </Button>
              </ModalFooter>
            </form>
          )}
        </ModalContent>
      </Modal>

      <Modal
        isOpen={Boolean(pendingDeactivateUser)}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setPendingDeactivateUser(null);
          }
        }}
        placement="center"
      >
        <ModalContent>
          {(closeModal) => (
            <>
              <ModalHeader>
                <span className="inline-flex items-center gap-2">
                  <MaterialSymbol name="toggle_off" className="text-[20px] text-warning" />
                  Desativar usuário
                </span>
              </ModalHeader>
              <ModalBody>
                <p className="text-sm text-foreground/80">
                  Tem certeza que deseja desativar o usuário{" "}
                  <span className="font-semibold text-foreground">
                    {pendingDeactivateUser?.login}
                  </span>
                  ?
                </p>
                <p className="text-xs text-foreground/70">
                  Esta ação pode ser revertida depois ativando novamente.
                </p>
              </ModalBody>
              <ModalFooter>
                <Button
                  variant="light"
                  startContent={<MaterialSymbol name="close" className="text-[18px]" />}
                  onPress={() => {
                    setPendingDeactivateUser(null);
                    closeModal();
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  color="danger"
                  isLoading={isUpdatingStatus}
                  startContent={
                    isUpdatingStatus ? null : (
                      <MaterialSymbol name="delete" className="text-[18px]" />
                    )
                  }
                  onPress={confirmDeactivateUser}
                >
                  Confirmar desativação
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </section>
  );
}

function getUserInitial(name?: string, login?: string): string {
  const source = (name || login || "U").trim();
  return source.charAt(0).toUpperCase();
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

function readTokenFromCookie(): string {
  if (typeof document === "undefined") {
    return "";
  }

  const cookie = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith("admin_token="));
  if (!cookie) {
    return "";
  }

  return decodeURIComponent(cookie.split("=")[1] || "").trim();
}
