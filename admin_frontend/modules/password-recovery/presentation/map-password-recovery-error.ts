import {
  InvalidPasswordRecoveryInputError,
  PasswordRecoveryServiceUnavailableError,
  UnexpectedPasswordRecoveryError,
} from "../domain/errors/password-recovery-errors";

export function mapPasswordRecoveryErrorToMessage(
  cause: unknown,
  fallback = "Falha ao processar a operação.",
): string {
  if (cause instanceof PasswordRecoveryServiceUnavailableError) {
    return "Falha de conexão com a API.";
  }

  if (
    cause instanceof InvalidPasswordRecoveryInputError ||
    cause instanceof UnexpectedPasswordRecoveryError
  ) {
    return cause.message || fallback;
  }

  return fallback;
}
