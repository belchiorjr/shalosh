import { adminBackendUrl } from "@/config/api";
import { FetchHttpClient } from "@/modules/shared/infrastructure/http/fetch-http-client";
import { GetEmailSettingsUseCase } from "../application/use-cases/get-email-settings-use-case";
import { SaveEmailSettingsUseCase } from "../application/use-cases/save-email-settings-use-case";
import { SendTestEmailUseCase } from "../application/use-cases/send-test-email-use-case";
import { BrowserCookieEmailSettingsTokenProvider } from "../infrastructure/browser-cookie-email-settings-token-provider";
import { HttpEmailSettingsRepository } from "../infrastructure/http-email-settings-repository";

export function createEmailSettingsControllerDependencies() {
  const httpClient = new FetchHttpClient();
  const tokenProvider = new BrowserCookieEmailSettingsTokenProvider();
  const emailSettingsRepository = new HttpEmailSettingsRepository(
    adminBackendUrl,
    httpClient,
  );

  return {
    getEmailSettingsUseCase: new GetEmailSettingsUseCase(
      emailSettingsRepository,
      tokenProvider,
    ),
    saveEmailSettingsUseCase: new SaveEmailSettingsUseCase(
      emailSettingsRepository,
      tokenProvider,
    ),
    sendTestEmailUseCase: new SendTestEmailUseCase(
      emailSettingsRepository,
      tokenProvider,
    ),
  };
}
