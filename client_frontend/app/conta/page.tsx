"use client";

import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { Input } from "@heroui/input";
import { Spinner } from "@heroui/spinner";
import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";

import { MaterialSymbol } from "@/components/material-symbol";
import { ClientApiError, fetchClientApi } from "@/lib/client-api";
import { saveClientProfile, writeClientTokenCookie } from "@/lib/client-auth";

interface ClientAccount {
  id: string;
  name: string;
  email: string;
  login: string;
  avatar?: string;
  active: boolean;
}

interface AccountUpdateResponse {
  token?: string;
  expiresAt?: string;
  client?: ClientAccount;
}

export default function ContaPage() {
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [avatar, setAvatar] = useState("");

  useEffect(() => {
    void loadAccount();
  }, []);

  const loadAccount = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const account = await fetchClientApi<ClientAccount>("/client-auth/account");
      setName(account.name || "");
      setEmail(account.email || "");
      setLogin(account.login || "");
      setAvatar(account.avatar || "");
      setPassword("");
    } catch (requestError) {
      if (requestError instanceof ClientApiError) {
        setError(requestError.message);
      } else {
        setError("Falha de conexão com a API.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const onAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Selecione um arquivo de imagem válido.");
      event.target.value = "";
      return;
    }

    if (file.size > 1024 * 1024) {
      setError("A imagem deve ter no máximo 1MB.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAvatar(typeof reader.result === "string" ? reader.result : "");
      setError(null);
      event.target.value = "";
    };
    reader.onerror = () => {
      setError("Não foi possível carregar a imagem.");
      event.target.value = "";
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSaving(true);

    try {
      const response = await fetchClientApi<AccountUpdateResponse>("/client-auth/account", {
        method: "PATCH",
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          login: login.trim(),
          password: password.trim(),
          avatar: avatar || "",
        }),
      });

      if (response.token) {
        writeClientTokenCookie(response.token, response.expiresAt);
      }

      if (response.client) {
        setName(response.client.name || "");
        setEmail(response.client.email || "");
        setLogin(response.client.login || "");
        setAvatar(response.client.avatar || "");

        saveClientProfile({
          id: response.client.id,
          name: response.client.name,
          email: response.client.email,
          login: response.client.login,
          avatar: response.client.avatar || "",
        });
      }

      setPassword("");
      setSuccess("Dados da conta atualizados com sucesso.");
    } catch (requestError) {
      if (requestError instanceof ClientApiError) {
        setError(requestError.message);
      } else {
        setError("Falha de conexão com a API.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-violet-200 bg-violet-100 text-violet-700 dark:border-violet-900/70 dark:bg-violet-950/40 dark:text-violet-300">
            <MaterialSymbol name="badge" className="text-[24px] text-violet-700 dark:text-violet-300" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground">Conta do cliente</h1>
        </div>
        <p className="text-sm text-foreground/70">
          Edite os dados básicos da conta do cliente.
        </p>
      </header>

      {error ? (
        <Card className="border border-danger/30 bg-danger/10">
          <CardBody>
            <p className="text-sm font-medium text-danger">{error}</p>
          </CardBody>
        </Card>
      ) : null}

      {success ? (
        <Card className="border border-success/30 bg-success/10">
          <CardBody>
            <p className="text-sm font-medium text-success">{success}</p>
          </CardBody>
        </Card>
      ) : null}

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-foreground/70">
          <Spinner size="sm" />
          Carregando conta...
        </div>
      ) : (
        <Card className="border border-default-200">
          <CardBody>
            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="flex flex-wrap items-center gap-3 rounded-xl border border-default-200 bg-default-50 p-3">
                <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-default-200 bg-default-100 text-xl font-semibold text-black dark:text-white">
                  {avatar ? (
                    <img
                      src={avatar}
                      alt="Avatar do cliente"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    (name || login || "C").trim().charAt(0).toUpperCase()
                  )}
                </div>

                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onAvatarChange}
                />

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="flat"
                    startContent={
                      <MaterialSymbol
                        name="upload"
                        className="text-[18px] text-violet-700 dark:text-violet-300"
                      />
                    }
                    onPress={() => avatarInputRef.current?.click()}
                  >
                    Trocar avatar
                  </Button>
                  <Button
                    type="button"
                    variant="light"
                    startContent={
                      <MaterialSymbol
                        name="delete"
                        className="text-[18px] text-rose-700 dark:text-rose-300"
                      />
                    }
                    onPress={() => setAvatar("")}
                  >
                    Remover
                  </Button>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <Input label="Nome" value={name} onValueChange={setName} isRequired />
                <Input
                  label="Email"
                  value={email}
                  onValueChange={setEmail}
                  type="email"
                  isRequired
                />
                <Input label="Login" value={login} onValueChange={setLogin} isRequired />
                <Input
                  label="Nova senha (opcional)"
                  value={password}
                  onValueChange={setPassword}
                  type="password"
                  placeholder="Preencha para alterar"
                />
              </div>

              <div className="flex justify-end">
                <Button
                  color="primary"
                  type="submit"
                  isLoading={isSaving}
                  startContent={
                    isSaving ? null : (
                      <MaterialSymbol
                        name="save"
                        className="text-[18px] text-violet-700 dark:text-violet-300"
                      />
                    )
                  }
                >
                  Salvar alterações
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}
    </section>
  );
}
