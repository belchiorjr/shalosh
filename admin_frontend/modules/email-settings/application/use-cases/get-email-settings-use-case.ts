import { MissingEmailSettingsSessionError } from "../../domain/errors/email-settings-errors";
import type { EmailSettings } from "../../domain/entities/email-settings";
import type { EmailSettingsRepository } from "../../domain/repositories/email-settings-repository";
import type { EmailSettingsTokenProvider } from "../ports/email-settings-token-provider";

export class GetEmailSettingsUseCase {
  constructor(
    private readonly emailSettingsRepository: EmailSettingsRepository,
    private readonly tokenProvider: EmailSettingsTokenProvider,
  ) {}

  async execute(): Promise<EmailSettings> {
    const token = this.tokenProvider.getToken().trim();
    if (!token) {
      throw new MissingEmailSettingsSessionError();
    }

    return this.emailSettingsRepository.getEmailSettings(token);
  }
}
