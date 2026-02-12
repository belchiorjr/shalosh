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
import { createPermissionsControllerDependencies } from "@/modules/security/composition/create-permissions-controller-deps";
import type { Permission } from "@/modules/security/domain/entities/permission";
import { usePermissionsController } from "@/modules/security/presentation/use-permissions-controller";

export default function PermissionsPage() {
  const controllerDependencies = useMemo(
    () => createPermissionsControllerDependencies(),
    [],
  );
  const {
    permissions,
    isLoading,
    error,
    isSaving,
    isUpdatingStatus,
    savePermission,
    deactivatePermission,
  } = usePermissionsController(controllerDependencies);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPermission, setEditingPermission] = useState<Permission | null>(
    null,
  );
  const [viewingPermission, setViewingPermission] = useState<Permission | null>(
    null,
  );
  const [formCode, setFormCode] = useState("");
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formActive, setFormActive] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  const totalPermissions = useMemo(
    () => permissions.length,
    [permissions.length],
  );

  const openCreateModal = () => {
    setEditingPermission(null);
    setFormCode("");
    setFormName("");
    setFormDescription("");
    setFormActive(true);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (permission: Permission) => {
    setEditingPermission(permission);
    setFormCode(permission.code || "");
    setFormName(permission.name || "");
    setFormDescription(permission.description || "");
    setFormActive(Boolean(permission.active));
    setFormError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPermission(null);
    setFormError(null);
  };

  const deactivatePermissionFromList = async (permission: Permission) => {
    const result = await deactivatePermission(permission);
    if (result.data && viewingPermission?.id === result.data.id) {
      setViewingPermission(result.data);
    }
  };

  const handlePermissionMenuAction = (
    permission: Permission,
    action: string | number,
  ) => {
    const selectedAction = String(action);

    if (selectedAction === "view") {
      setViewingPermission(permission);
      return;
    }

    if (selectedAction === "edit") {
      openEditModal(permission);
      return;
    }

    if (selectedAction === "deactivate") {
      void deactivatePermissionFromList(permission);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedCode = formCode.trim().toLowerCase();
    const normalizedName = formName.trim();
    const normalizedDescription = formDescription.trim();

    if (!normalizedCode || !normalizedName) {
      setFormError("Código e nome são obrigatórios.");
      return;
    }

    setFormError(null);

    const result = await savePermission({
      permissionId: editingPermission?.id,
      code: normalizedCode,
      name: normalizedName,
      description: normalizedDescription,
      active: formActive,
    });

    if (result.error) {
      setFormError(result.error);
      return;
    }

    if (result.data && viewingPermission?.id === result.data.id) {
      setViewingPermission(result.data);
    }

    closeModal();
  };

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-default-200 bg-content1/70 p-6 backdrop-blur-md">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-foreground/60">
              <MaterialSymbol name="key" className="text-[16px]" />
              Segurança
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-foreground">
              Permissões
            </h1>
            <p className="mt-2 text-sm text-foreground/80">
              Cadastre e edite permissões que serão vinculadas aos perfis.
            </p>
            <p className="mt-2 text-sm font-medium text-foreground/80">
              Total de permissões: {totalPermissions}
            </p>
          </div>

          <Button
            color="primary"
            startContent={<MaterialSymbol name="add" className="text-[18px]" />}
            onPress={openCreateModal}
          >
            Nova permissão
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-default-200 bg-content1/70 backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-content1/70">
              <tr className="border-b border-default-200">
                <th className="px-4 py-3 font-semibold text-foreground/80">
                  Código
                </th>
                <th className="px-4 py-3 font-semibold text-foreground/80">
                  Nome
                </th>
                <th className="px-4 py-3 font-semibold text-foreground/80">
                  Descrição
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
                    Carregando permissões...
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

              {!isLoading && !error && permissions.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-foreground/70" colSpan={6}>
                    Nenhuma permissão cadastrada.
                  </td>
                </tr>
              ) : null}

              {!isLoading && !error
                ? permissions.map((permission) => (
                    <tr
                      key={permission.id}
                      className="border-b border-default-200/70 last:border-b-0"
                    >
                      <td className="px-4 py-3 text-foreground/90">
                        {permission.code || "-"}
                      </td>
                      <td className="px-4 py-3 text-foreground">
                        {permission.name || "-"}
                      </td>
                      <td className="px-4 py-3 text-foreground/80">
                        {permission.description || "-"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            permission.active
                              ? "rounded-full border border-success/40 bg-success/10 px-2.5 py-1 text-xs font-medium text-success"
                              : "rounded-full border border-danger/40 bg-danger/10 px-2.5 py-1 text-xs font-medium text-danger"
                          }
                        >
                          {permission.active ? "Ativa" : "Inativa"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-foreground/80">
                        {formatDateTime(permission.updated)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Dropdown placement="bottom-end">
                          <DropdownTrigger>
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                              aria-label={`Abrir ações da permissão ${permission.code}`}
                            >
                              <MaterialSymbol name="more_vert" className="text-[20px]" />
                            </Button>
                          </DropdownTrigger>
                          <DropdownMenu
                            aria-label={`Ações da permissão ${permission.code}`}
                            onAction={(key) =>
                              handlePermissionMenuAction(permission, key)
                            }
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
                              isDisabled={!permission.active || isUpdatingStatus}
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
        isOpen={Boolean(viewingPermission)}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setViewingPermission(null);
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
                  Visualizar permissão
                </span>
              </ModalHeader>
              <ModalBody className="gap-3">
                <div className="grid gap-3 md:grid-cols-2">
                  <InfoField label="ID" value={viewingPermission?.id} />
                  <InfoField label="Código" value={viewingPermission?.code} />
                </div>
                <InfoField label="Nome" value={viewingPermission?.name} />
                <InfoField
                  label="Descrição"
                  value={viewingPermission?.description || "-"}
                />
                <div className="grid gap-3 md:grid-cols-3">
                  <InfoField
                    label="Status"
                    value={viewingPermission?.active ? "Ativa" : "Inativa"}
                  />
                  <InfoField
                    label="Criado em"
                    value={formatDateTime(viewingPermission?.created)}
                  />
                  <InfoField
                    label="Atualizado em"
                    value={formatDateTime(viewingPermission?.updated)}
                  />
                </div>
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
        size="2xl"
      >
        <ModalContent>
          {(closePermissionModal) => (
            <form onSubmit={handleSubmit}>
              <ModalHeader>
                <span className="inline-flex items-center gap-2">
                  <MaterialSymbol
                    name={editingPermission ? "edit" : "add"}
                    className="text-[20px] text-primary"
                  />
                  {editingPermission ? "Editar permissão" : "Nova permissão"}
                </span>
              </ModalHeader>
              <ModalBody className="gap-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <Input
                    label="Código"
                    value={formCode}
                    onValueChange={setFormCode}
                    placeholder="ex: users.read"
                    isRequired
                  />
                  <Input
                    label="Nome"
                    value={formName}
                    onValueChange={setFormName}
                    placeholder="ex: Ler usuários"
                    isRequired
                  />
                </div>

                <Input
                  label="Descrição"
                  value={formDescription}
                  onValueChange={setFormDescription}
                  placeholder="Descreva o propósito da permissão"
                />

                <label className="flex items-center gap-2 text-sm text-foreground/80">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-default-300"
                    checked={formActive}
                    onChange={(event) => setFormActive(event.target.checked)}
                  />
                  Permissão ativa
                </label>

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
                    closePermissionModal();
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
