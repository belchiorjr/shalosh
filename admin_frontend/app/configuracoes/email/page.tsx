"use client";

import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { Input } from "@heroui/input";
import { Switch } from "@heroui/switch";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { MaterialSymbol } from "@/components/material-symbol";
import { createEmailSettingsControllerDependencies } from "@/modules/email-settings/composition/create-email-settings-controller-deps";
import { useEmailSettingsController } from "@/modules/email-settings/presentation/use-email-settings-controller";

const defaultApiUrl = "https://api.turbo-smtp.com/api/v2/mail/send";

export default function EmailSettingsPage() {
  const controllerDependencies = useMemo(
    () => createEmailSettingsControllerDependencies(),
    [],
  );
  const {
    settings,
    isLoading,
    error,
    isSaving,
    isSendingTest,
    saveSettings,
    sendTestEmail,
  } = useEmailSettingsController(controllerDependencies);

  const [apiUrl, setApiUrl] = useState(defaultApiUrl);
  const [authUser, setAuthUser] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [fromEmail, setFromEmail] = useState("");
  const [fromName, setFromName] = useState("");
  const [adminResetUrl, setAdminResetUrl] = useState("");
  const [clientResetUrl, setClientResetUrl] = useState("");
  const [tokenTtlMinutes, setTokenTtlMinutes] = useState("60");
  const [active, setActive] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!settings) {
      return;
    }

    setApiUrl(settings.apiUrl || defaultApiUrl);
    setAuthUser(settings.authUser);
    setAuthPassword("");
    setFromEmail(settings.fromEmail);
    setFromName(settings.fromName);
    setAdminResetUrl(settings.adminResetUrl);
    setClientResetUrl(settings.clientResetUrl);
    setTokenTtlMinutes(String(settings.tokenTtlMinutes || 60));
    setActive(settings.active);
  }, [settings]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    const parsedTtl = Number(tokenTtlMinutes);
    if (!Number.isFinite(parsedTtl) || parsedTtl < 5 || parsedTtl > 1440) {
      setFormError("A expiração do link deve ficar entre 5 e 1440 minutos.");

      return;
    }

    if (active && !authPassword.trim() && !settings?.hasAuthPassword) {
      setFormError("Informe a senha da API turboSMTP para ativar o envio.");

      return;
    }

    const result = await saveSettings({
      apiUrl,
      authUser,
      authPassword,
      fromEmail,
      fromName,
      adminResetUrl,
      clientResetUrl,
      tokenTtlMinutes: parsedTtl,
      active,
    });

    if (result.error) {
      setFormError(result.error);

      return;
    }

    setAuthPassword("");
    setFormSuccess("Configuração de e-mail salva.");
  };

  const handleSendTest = async () => {
    setFormError(null);
    setFormSuccess(null);

    if (!testEmail.trim()) {
      setFormError("Informe o e-mail de destino do teste.");

      return;
    }

    const result = await sendTestEmail(testEmail);
    if (result.error) {
      setFormError(result.error);

      return;
    }

    setFormSuccess(`E-mail de teste enviado para ${testEmail.trim()}.`);
  };

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-foreground">
            Configuração de e-mail
          </h1>
          <p className="text-sm text-foreground/70">
            Credenciais turboSMTP usadas na recuperação de senha do painel
            administrativo e da área do cliente.
          </p>
        </div>
        {settings ? (
          <Chip
            color={settings.configurationOk ? "success" : "warning"}
            variant="flat"
            startContent={
              <MaterialSymbol
                name={settings.configurationOk ? "check_circle" : "warning"}
                className="text-[16px]"
              />
            }
          >
            {settings.configurationOk ? "Envio ativo" : "Envio inativo"}
          </Chip>
        ) : null}
      </header>

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <Card shadow="none" className="bg-content1/95">
        <CardHeader className="flex flex-col items-start gap-1">
          <h2 className="text-lg font-semibold text-foreground">turboSMTP</h2>
          <p className="text-sm text-foreground/70">
            A senha só é gravada quando preenchida; deixe em branco para manter a
            atual.
          </p>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="URL da API"
                value={apiUrl}
                onValueChange={setApiUrl}
                isDisabled={isLoading}
              />
              <Input
                label="Usuário da API (authuser)"
                placeholder="conta@dominio.com"
                value={authUser}
                onValueChange={setAuthUser}
                isDisabled={isLoading}
              />
              <Input
                label="Senha da API (authpass)"
                type="password"
                placeholder={
                  settings?.hasAuthPassword
                    ? "•••••••• (mantida)"
                    : "Senha da conta turboSMTP"
                }
                value={authPassword}
                onValueChange={setAuthPassword}
                isDisabled={isLoading}
              />
              <Input
                label="Expiração do link (minutos)"
                type="number"
                min={5}
                max={1440}
                value={tokenTtlMinutes}
                onValueChange={setTokenTtlMinutes}
                isDisabled={isLoading}
              />
              <Input
                label="E-mail remetente"
                type="email"
                placeholder="nao-responda@shalosh.com.br"
                value={fromEmail}
                onValueChange={setFromEmail}
                isDisabled={isLoading}
              />
              <Input
                label="Nome do remetente"
                placeholder="Shalosh"
                value={fromName}
                onValueChange={setFromName}
                isDisabled={isLoading}
              />
              <Input
                label="URL de redefinição (admin)"
                placeholder="http://localhost:3001/reset-password"
                value={adminResetUrl}
                onValueChange={setAdminResetUrl}
                isDisabled={isLoading}
              />
              <Input
                label="URL de redefinição (cliente)"
                placeholder="http://localhost:3002/reset-password"
                value={clientResetUrl}
                onValueChange={setClientResetUrl}
                isDisabled={isLoading}
              />
            </div>

            <Switch
              isSelected={active}
              onValueChange={setActive}
              isDisabled={isLoading}
            >
              Habilitar envio de e-mails
            </Switch>

            {formError ? (
              <p className="text-sm text-danger">{formError}</p>
            ) : null}
            {formSuccess ? (
              <p className="text-sm text-success">{formSuccess}</p>
            ) : null}

            <Button
              color="primary"
              type="submit"
              isLoading={isSaving}
              isDisabled={isLoading}
              startContent={
                <MaterialSymbol name="save" className="text-[18px]" />
              }
            >
              Salvar configuração
            </Button>
          </form>

          <Divider className="my-6" />

          <div className="space-y-3">
            <h3 className="text-base font-semibold text-foreground">
              Enviar e-mail de teste
            </h3>
            <div className="flex flex-wrap items-end gap-3">
              <Input
                className="max-w-sm"
                label="E-mail de destino"
                type="email"
                value={testEmail}
                onValueChange={setTestEmail}
                isDisabled={isLoading}
              />
              <Button
                variant="flat"
                onPress={handleSendTest}
                isLoading={isSendingTest}
                isDisabled={isLoading}
                startContent={
                  <MaterialSymbol name="outgoing_mail" className="text-[18px]" />
                }
              >
                Enviar teste
              </Button>
            </div>
            <p className="text-xs text-foreground/60">
              O teste usa a configuração já salva. Salve antes de testar
              alterações.
            </p>
          </div>
        </CardBody>
      </Card>
    </section>
  );
}
