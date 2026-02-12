import {
  MissingSecuritySessionError,
  SecurityServiceUnavailableError,
  UnexpectedSecurityError,
} from "../domain/errors/security-errors";

export function mapSecurityErrorToMessage(
  cause: unknown,
  fallback = "Falha ao processar a operação.",
): string {
  if (cause instanceof MissingSecuritySessionError) {
    return "Sessão inválida. Faça login novamente.";
  }

  if (cause instanceof SecurityServiceUnavailableError) {
    return "Falha de conexão com o backend.";
  }

  if (cause instanceof UnexpectedSecurityError) {
    return cause.message || fallback;
  }

  return fallback;
}

