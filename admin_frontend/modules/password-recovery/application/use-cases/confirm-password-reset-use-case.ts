import { InvalidPasswordRecoveryInputError } from "../../domain/errors/password-recovery-errors";
import type { PasswordRecoveryRepository } from "../../domain/repositories/password-recovery-repository";

export interface ConfirmPasswordResetRequest {
  token: string;
  password: string;
  passwordConfirmation: string;
}

export class ConfirmPasswordResetUseCase {
  constructor(
    private readonly passwordRecoveryRepository: PasswordRecoveryRepository,
  ) {}

  async execute(request: ConfirmPasswordResetRequest): Promise<void> {
    const token = request.token.trim();
    const password = request.password.trim();

    if (!token) {
      throw new InvalidPasswordRecoveryInputError(
        "Link de recuperação inválido.",
      );
    }
    if (password.length < 6) {
      throw new InvalidPasswordRecoveryInputError(
        "A nova senha deve ter no mínimo 6 caracteres.",
      );
    }
    if (password !== request.passwordConfirmation.trim()) {
      throw new InvalidPasswordRecoveryInputError("As senhas não conferem.");
    }

    await this.passwordRecoveryRepository.confirmReset(token, password);
  }
}
