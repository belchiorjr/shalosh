import { adminBackendUrl } from "@/config/api";
import { FetchHttpClient } from "@/modules/shared/infrastructure/http/fetch-http-client";
import { DeactivatePermissionUseCase } from "../application/use-cases/deactivate-permission-use-case";
import { ListPermissionsUseCase } from "../application/use-cases/list-permissions-use-case";
import { SavePermissionUseCase } from "../application/use-cases/save-permission-use-case";
import { BrowserCookieSecurityTokenProvider } from "../infrastructure/browser-cookie-security-token-provider";
import { HttpSecurityRepository } from "../infrastructure/http-security-repository";

export function createPermissionsControllerDependencies() {
  const httpClient = new FetchHttpClient();
  const tokenProvider = new BrowserCookieSecurityTokenProvider();
  const securityRepository = new HttpSecurityRepository(adminBackendUrl, httpClient);

  return {
    listPermissionsUseCase: new ListPermissionsUseCase(
      securityRepository,
      tokenProvider,
    ),
    savePermissionUseCase: new SavePermissionUseCase(
      securityRepository,
      tokenProvider,
    ),
    deactivatePermissionUseCase: new DeactivatePermissionUseCase(
      securityRepository,
      tokenProvider,
    ),
  };
}

