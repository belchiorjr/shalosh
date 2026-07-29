"use client";

import { useState } from "react";
import type { ConfirmPasswordResetUseCase } from "../application/use-cases/confirm-password-reset-use-case";
import type { RequestPasswordResetUseCase } from "../application/use-cases/request-password-reset-use-case";
import { mapPasswordRecoveryErrorToMessage } from "./map-password-recovery-error";

interface PasswordRecoveryControllerDependencies {
  requestPasswordResetUseCase: RequestPasswordResetUseCase;
  confirmPasswordResetUseCase: ConfirmPasswordResetUseCase;
}

export function usePasswordRecoveryController({
  requestPasswordResetUseCase,
  confirmPasswordResetUseCase,
}: PasswordRecoveryControllerDependencies) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const requestReset = async (login: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      setSuccessMessage(await requestPasswordResetUseCase.execute(login));

      return true;
    } catch (cause) {
      setError(
        mapPasswordRecoveryErrorToMessage(
          cause,
          "Não foi possível solicitar a recuperação de senha.",
        ),
      );

      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const confirmReset = async (
    token: string,
    password: string,
    passwordConfirmation: string,
  ): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await confirmPasswordResetUseCase.execute({
        token,
        password,
        passwordConfirmation,
      });
      setSuccessMessage("Senha redefinida. Você já pode entrar no painel.");

      return true;
    } catch (cause) {
      setError(
        mapPasswordRecoveryErrorToMessage(
          cause,
          "Não foi possível redefinir a senha.",
        ),
      );

      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    successMessage,
    requestReset,
    confirmReset,
  };
}
