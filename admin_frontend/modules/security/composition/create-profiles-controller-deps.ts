import { adminBackendUrl } from "@/config/api";
import { FetchHttpClient } from "@/modules/shared/infrastructure/http/fetch-http-client";
import { DeactivateProfileUseCase } from "../application/use-cases/deactivate-profile-use-case";
import { GetCurrentUserSecurityContextUseCase } from "../application/use-cases/get-current-user-security-context-use-case";
import { GetProfilePermissionIdsUseCase } from "../application/use-cases/get-profile-permission-ids-use-case";
import { ListPermissionOptionsUseCase } from "../application/use-cases/list-permission-options-use-case";
import { ListProfilesUseCase } from "../application/use-cases/list-profiles-use-case";
import { SaveProfileUseCase } from "../application/use-cases/save-profile-use-case";
import { BrowserCookieSecurityTokenProvider } from "../infrastructure/browser-cookie-security-token-provider";
import { HttpSecurityRepository } from "../infrastructure/http-security-repository";

export function createProfilesControllerDependencies() {
  const httpClient = new FetchHttpClient();
  const tokenProvider = new BrowserCookieSecurityTokenProvider();
  const securityRepository = new HttpSecurityRepository(adminBackendUrl, httpClient);

  return {
    listProfilesUseCase: new ListProfilesUseCase(securityRepository, tokenProvider),
    getCurrentUserSecurityContextUseCase: new GetCurrentUserSecurityContextUseCase(
      securityRepository,
      tokenProvider,
    ),
    listPermissionOptionsUseCase: new ListPermissionOptionsUseCase(
      securityRepository,
      tokenProvider,
    ),
    getProfilePermissionIdsUseCase: new GetProfilePermissionIdsUseCase(
      securityRepository,
      tokenProvider,
    ),
    saveProfileUseCase: new SaveProfileUseCase(securityRepository, tokenProvider),
    deactivateProfileUseCase: new DeactivateProfileUseCase(
      securityRepository,
      tokenProvider,
    ),
  };
}
