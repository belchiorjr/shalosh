import { InvalidPasswordRecoveryInputError } from "../../domain/errors/password-recovery-errors";
import type { PasswordRecoveryRepository } from "../../domain/repositories/password-recovery-repository";

export class RequestPasswordResetUseCase {
  constructor(
    private readonly passwordRecoveryRepository: PasswordRecoveryRepository,
  ) {}

  async execute(login: string): Promise<string> {
    const normalizedLogin = login.trim();
    if (!normalizedLogin) {
      throw new InvalidPasswordRecoveryInputError(
        "Informe seu login ou e-mail.",
      );
    }

    return this.passwordRecoveryRepository.requestReset(normalizedLogin);
  }
}
