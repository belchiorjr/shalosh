"use client";

import { useState } from "react";
import type { AuthSessionStore } from "../application/ports/auth-session-store";
import type { LoginUseCase } from "../application/use-cases/login-use-case";
import {
  AuthServiceUnavailableError,
  InvalidCredentialsError,
  MissingCredentialsError,
} from "../domain/errors/auth-errors";

interface LoginControllerDependencies {
  loginUseCase: LoginUseCase;
  sessionStore: AuthSessionStore;
}

export function useLoginController({
  loginUseCase,
  sessionStore,
}: LoginControllerDependencies) {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (): Promise<boolean> => {
    setError(null);

    try {
      setIsLoading(true);
      const session = await loginUseCase.execute({ login, password });
      sessionStore.save(session);
      return true;
    } catch (cause) {
      setError(mapLoginErrorToMessage(cause));
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    login,
    password,
    isLoading,
    error,
    setLogin,
    setPassword,
    submit,
  };
}

function mapLoginErrorToMessage(cause: unknown): string {
  if (cause instanceof MissingCredentialsError) {
    return "Informe login e senha.";
  }

  if (cause instanceof InvalidCredentialsError) {
    return "Login ou senha invalidos.";
  }

  if (cause instanceof AuthServiceUnavailableError) {
    return "Nao foi possivel conectar ao servidor.";
  }

  return "Falha ao autenticar.";
}
