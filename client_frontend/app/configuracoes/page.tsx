"use client";

import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { Switch } from "@heroui/switch";
import { useEffect, useState } from "react";

import { MaterialSymbol } from "@/components/material-symbol";

const STORAGE_KEY = "client_portal_settings";

interface PortalSettings {
  notifyComments: boolean;
  notifyPayments: boolean;
}

const defaultSettings: PortalSettings = {
  notifyComments: true,
  notifyPayments: true,
};

export default function ConfiguracoesPage() {
  const [settings, setSettings] = useState<PortalSettings>(defaultSettings);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as Partial<PortalSettings>;
      setSettings({
        notifyComments:
          typeof parsed.notifyComments === "boolean"
            ? parsed.notifyComments
            : defaultSettings.notifyComments,
        notifyPayments:
          typeof parsed.notifyPayments === "boolean"
            ? parsed.notifyPayments
            : defaultSettings.notifyPayments,
      });
    } catch {
      setSettings(defaultSettings);
    }
  }, []);

  const saveSettings = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    }

    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  };

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-rose-200 bg-rose-100 text-rose-700 dark:border-rose-900/70 dark:bg-rose-950/40 dark:text-rose-300">
            <MaterialSymbol name="settings" className="text-[24px] text-rose-700 dark:text-rose-300" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground">Configurações</h1>
        </div>
        <p className="text-sm text-foreground/70">
          Preferências do portal do cliente.
        </p>
      </header>

      <Card className="border border-default-200">
        <CardBody className="space-y-4">
          <Switch
            isSelected={settings.notifyComments}
            onValueChange={(value) => setSettings((current) => ({ ...current, notifyComments: value }))}
          >
            Receber aviso de novos comentários
          </Switch>

          <Switch
            isSelected={settings.notifyPayments}
            onValueChange={(value) => setSettings((current) => ({ ...current, notifyPayments: value }))}
          >
            Receber aviso de pagamentos e débitos
          </Switch>

          <div className="flex items-center justify-between pt-2">
            <p className="text-sm text-foreground/70">
              {saved ? "Configurações salvas." : "As preferências são salvas neste navegador."}
            </p>
            <Button
              color="primary"
              onPress={saveSettings}
              startContent={
                <MaterialSymbol
                  name="save"
                  className="text-[18px] text-rose-700 dark:text-rose-300"
                />
              }
            >
              Salvar
            </Button>
          </div>
        </CardBody>
      </Card>
    </section>
  );
}
