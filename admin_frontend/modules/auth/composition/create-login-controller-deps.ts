import { adminBackendUrl } from "@/config/api";
import { LoginUseCase } from "../application/use-cases/login-use-case";
import { BrowserCookieSessionStore } from "../infrastructure/browser-cookie-session-store";
import { HttpAuthRepository } from "../infrastructure/http-auth-repository";
import { FetchHttpClient } from "@/modules/shared/infrastructure/http/fetch-http-client";

export function createLoginControllerDependencies() {
  const httpClient = new FetchHttpClient();
  const authRepository = new HttpAuthRepository(adminBackendUrl, httpClient);
  const loginUseCase = new LoginUseCase(authRepository);
  const sessionStore = new BrowserCookieSessionStore();

  return {
    loginUseCase,
    sessionStore,
  };
}
