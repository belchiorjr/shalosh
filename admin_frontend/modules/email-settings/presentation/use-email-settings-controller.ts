"use client";

import { useEffect, useState } from "react";
import type { GetEmailSettingsUseCase } from "../application/use-cases/get-email-settings-use-case";
import type { SaveEmailSettingsUseCase } from "../application/use-cases/save-email-settings-use-case";
import type { SendTestEmailUseCase } from "../application/use-cases/send-test-email-use-case";
import type { EmailSettings } from "../domain/entities/email-settings";
import type { SaveEmailSettingsInput } from "../domain/repositories/email-settings-repository";
import { mapEmailSettingsErrorToMessage } from "./map-email-settings-error";

interface EmailSettingsControllerDependencies {
  getEmailSettingsUseCase: GetEmailSettingsUseCase;
  saveEmailSettingsUseCase: SaveEmailSettingsUseCase;
  sendTestEmailUseCase: SendTestEmailUseCase;
}

interface OperationResult<T> {
  data?: T;
  error?: string;
}

export function useEmailSettingsController({
  getEmailSettingsUseCase,
  saveEmailSettingsUseCase,
  sendTestEmailUseCase,
}: EmailSettingsControllerDependencies) {
  const [settings, setSettings] = useState<EmailSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);

  useEffect(() => {
    void loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    setError(null);

    try {
      setSettings(await getEmailSettingsUseCase.execute());
    } catch (cause) {
      setError(
        mapEmailSettingsErrorToMessage(
          cause,
          "Não foi possível carregar a configuração de e-mail.",
        ),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async (
    input: SaveEmailSettingsInput,
  ): Promise<OperationResult<EmailSettings>> => {
    setIsSaving(true);

    try {
      const savedSettings = await saveEmailSettingsUseCase.execute(input);
      setSettings(savedSettings);

      return { data: savedSettings };
    } catch (cause) {
      return {
        error: mapEmailSettingsErrorToMessage(
          cause,
          "Não foi possível salvar a configuração de e-mail.",
        ),
      };
    } finally {
      setIsSaving(false);
    }
  };

  const sendTestEmail = async (
    toEmail: string,
  ): Promise<OperationResult<boolean>> => {
    setIsSendingTest(true);

    try {
      await sendTestEmailUseCase.execute(toEmail);

      return { data: true };
    } catch (cause) {
      return {
        error: mapEmailSettingsErrorToMessage(
          cause,
          "Não foi possível enviar o e-mail de teste.",
        ),
      };
    } finally {
      setIsSendingTest(false);
    }
  };

  return {
    settings,
    isLoading,
    error,
    isSaving,
    isSendingTest,
    reload: loadSettings,
    saveSettings,
    sendTestEmail,
  };
}
