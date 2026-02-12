import { MissingCredentialsError } from "../../domain/errors/auth-errors";
import type { AuthRepository } from "../../domain/repositories/auth-repository";
import type { AuthSession } from "../../domain/entities/auth-session";
import type { LoginCredentials } from "../../domain/value-objects/login-credentials";

export class LoginUseCase {
  constructor(private readonly authRepository: AuthRepository) {}

  async execute(input: LoginCredentials): Promise<AuthSession> {
    const credentials = {
      login: input.login.trim(),
      password: input.password.trim(),
    };

    if (!credentials.login || !credentials.password) {
      throw new MissingCredentialsError();
    }

    return this.authRepository.login(credentials);
  }
}
