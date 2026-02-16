"use client";

import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/modal";
import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";

import { MaterialSymbol } from "@/components/material-symbol";

export interface AccountUserData {
  name: string;
  email: string;
  login: string;
  phone?: string;
  address?: string;
  avatar?: string;
}

interface AccountModalProps {
  isOpen: boolean;
  user: AccountUserData;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (
    data: AccountUserData & { password?: string },
  ) => Promise<{ error?: string }>;
}

export function AccountModal({
  isOpen,
  user,
  onOpenChange,
  onSave,
}: AccountModalProps) {
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [currentLogin, setCurrentLogin] = useState("");
  const [newLogin, setNewLogin] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [avatar, setAvatar] = useState("");
  const [password, setPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setName(user.name || "");
    setEmail(user.email || "");
    setCurrentLogin(user.login || "");
    setNewLogin("");
    setPhone(user.phone || "");
    setAddress(user.address || "");
    setAvatar(user.avatar || "");
    setPassword("");
    setAvatarError(null);
    setSaveError(null);
  }, [isOpen, user.address, user.avatar, user.email, user.login, user.name, user.phone]);

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.target;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setAvatarError("Selecione um arquivo de imagem válido.");
      input.value = "";
      return;
    }

    if (file.size > 1024 * 1024) {
      setAvatarError("A imagem deve ter no máximo 1MB.");
      input.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAvatar(typeof reader.result === "string" ? reader.result : "");
      setAvatarError(null);
      input.value = "";
    };
    reader.onerror = () => {
      setAvatarError("Não foi possível carregar a imagem.");
      input.value = "";
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaveError(null);
    setIsSaving(true);

    const result = await onSave({
      name: name.trim(),
      email: email.trim(),
      login: newLogin.trim() || currentLogin.trim(),
      phone: phone.trim(),
      address: address.trim(),
      avatar: avatar || "",
      password: password.trim() || undefined,
    });
    setIsSaving(false);

    if (result.error) {
      setSaveError(result.error);
      return;
    }

    onOpenChange(false);
  };

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      size="2xl"
      placement="center"
      scrollBehavior="inside"
    >
      <ModalContent>
        {(closeModal) => (
          <form onSubmit={handleSubmit}>
            <ModalHeader className="flex flex-col gap-1">
              <span className="inline-flex items-center gap-2">
                <MaterialSymbol
                  name="account_circle"
                  className="text-[22px] text-primary"
                />
                Conta do Usuário
              </span>
            </ModalHeader>
            <ModalBody className="gap-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground/60">
                Dados do usuário logado
              </p>

              <div className="rounded-xl border border-default-200 bg-default-50 p-3">
                <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-foreground/60">
                  <MaterialSymbol name="add_a_photo" className="text-[16px]" />
                  Avatar
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-default-200 bg-default-100 text-xl font-semibold text-black dark:text-white">
                    {avatar ? (
                      <img
                        src={avatar}
                        alt="Avatar do usuário"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      (name || currentLogin || "U").trim().charAt(0).toUpperCase()
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                    <Button
                      type="button"
                      variant="flat"
                      startContent={
                        <MaterialSymbol name="upload" className="text-[18px]" />
                      }
                      onPress={() => avatarInputRef.current?.click()}
                    >
                      Adicionar avatar
                    </Button>
                    <Button
                      type="button"
                      variant="light"
                      startContent={
                        <MaterialSymbol name="delete" className="text-[18px]" />
                      }
                      onPress={() => {
                        setAvatar("");
                        setAvatarError(null);
                      }}
                    >
                      Remover
                    </Button>
                  </div>
                </div>
                {avatarError ? (
                  <p className="mt-2 text-xs font-medium text-danger">{avatarError}</p>
                ) : (
                  <p className="mt-2 text-xs text-foreground/70">
                    Formatos aceitos: imagem. Tamanho máximo: 1MB.
                  </p>
                )}
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <Input
                  label="Nome"
                  value={name}
                  onValueChange={setName}
                  isRequired
                />
                <Input
                  label="Email"
                  value={email}
                  onValueChange={setEmail}
                  type="email"
                  isRequired
                />
                <Input
                  label="Login atual"
                  value={currentLogin}
                  onValueChange={setCurrentLogin}
                  isReadOnly
                />
                <Input
                  label="Telefone"
                  value={phone}
                  onValueChange={setPhone}
                  placeholder="(11) 99999-9999"
                />
              </div>

              <Input
                label="Endereço"
                value={address}
                onValueChange={setAddress}
                placeholder="Rua, número, bairro, cidade"
              />

              <div className="rounded-xl border border-default-200 bg-default-50 p-3">
                <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-foreground/60">
                  <MaterialSymbol name="key" className="text-[16px]" />
                  Credenciais (opcional)
                </p>
                <p className="mt-1 text-xs text-foreground/70">
                  Se informar um novo login e/ou senha, esses dados serão
                  atualizados na API do sistema.
                </p>

                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <Input
                    label="Novo login"
                    value={newLogin}
                    onValueChange={setNewLogin}
                    placeholder={currentLogin || "Informe um novo login"}
                  />
                  <Input
                    label="Nova senha"
                    value={password}
                    onValueChange={setPassword}
                    type="password"
                    placeholder="Informe para alterar"
                  />
                </div>
              </div>

              {saveError ? (
                <p className="text-sm font-medium text-danger">{saveError}</p>
              ) : null}
            </ModalBody>
            <ModalFooter>
              <Button
                variant="light"
                startContent={<MaterialSymbol name="close" className="text-[18px]" />}
                onPress={closeModal}
              >
                Cancelar
              </Button>
              <Button
                color="primary"
                type="submit"
                isLoading={isSaving}
                startContent={
                  isSaving ? null : <MaterialSymbol name="save" className="text-[18px]" />
                }
              >
                Salvar
              </Button>
            </ModalFooter>
          </form>
        )}
      </ModalContent>
    </Modal>
  );
}
