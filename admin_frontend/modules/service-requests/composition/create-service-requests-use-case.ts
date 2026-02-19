import { adminBackendUrl } from "@/config/api";
import { FetchHttpClient } from "@/modules/shared/infrastructure/http/fetch-http-client";
import { BrowserCookieSecurityTokenProvider } from "@/modules/security/infrastructure/browser-cookie-security-token-provider";
import { ManageServiceRequestsUseCase } from "../application/use-cases/manage-service-requests-use-case";
import { HttpServiceRequestsRepository } from "../infrastructure/http-service-requests-repository";

export function createServiceRequestsUseCase() {
  const httpClient = new FetchHttpClient();
  const tokenProvider = new BrowserCookieSecurityTokenProvider();
  const repository = new HttpServiceRequestsRepository(adminBackendUrl, httpClient);

  return new ManageServiceRequestsUseCase(repository, tokenProvider);
}
