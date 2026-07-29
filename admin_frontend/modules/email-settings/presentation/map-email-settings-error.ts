import {
  EmailSettingsNotConfiguredError,
  EmailSettingsServiceUnavailableError,
  MissingEmailSettingsSessionError,
  UnexpectedEmailSettingsError,
} from "../domain/errors/email-settings-errors";

export function mapEmailSettingsErrorToMessage(
  cause: unknown,
  fallback = "Falha ao processar a operação.",
): string {
  if (cause instanceof MissingEmailSettingsSessionError) {
    return "Sessão inválida. Faça login novamente.";
  }

  if (cause instanceof EmailSettingsServiceUnavailableError) {
    return "Falha de conexão com a API.";
  }

  if (
    cause instanceof EmailSettingsNotConfiguredError ||
    cause instanceof UnexpectedEmailSettingsError
  ) {
    return cause.message || fallback;
  }

  return fallback;
}
