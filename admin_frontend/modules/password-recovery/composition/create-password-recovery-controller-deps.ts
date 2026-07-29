import { adminBackendUrl } from "@/config/api";
import { FetchHttpClient } from "@/modules/shared/infrastructure/http/fetch-http-client";
import { ConfirmPasswordResetUseCase } from "../application/use-cases/confirm-password-reset-use-case";
import { RequestPasswordResetUseCase } from "../application/use-cases/request-password-reset-use-case";
import { HttpPasswordRecoveryRepository } from "../infrastructure/http-password-recovery-repository";

export function createPasswordRecoveryControllerDependencies() {
  const passwordRecoveryRepository = new HttpPasswordRecoveryRepository(
    adminBackendUrl,
    new FetchHttpClient(),
  );

  return {
    requestPasswordResetUseCase: new RequestPasswordResetUseCase(
      passwordRecoveryRepository,
    ),
    confirmPasswordResetUseCase: new ConfirmPasswordResetUseCase(
      passwordRecoveryRepository,
    ),
  };
}
