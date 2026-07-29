import { MissingEmailSettingsSessionError } from "../../domain/errors/email-settings-errors";
import type { EmailSettingsRepository } from "../../domain/repositories/email-settings-repository";
import type { EmailSettingsTokenProvider } from "../ports/email-settings-token-provider";

export class SendTestEmailUseCase {
  constructor(
    private readonly emailSettingsRepository: EmailSettingsRepository,
    private readonly tokenProvider: EmailSettingsTokenProvider,
  ) {}

  async execute(toEmail: string): Promise<void> {
    const token = this.tokenProvider.getToken().trim();
    if (!token) {
      throw new MissingEmailSettingsSessionError();
    }

    await this.emailSettingsRepository.sendTestEmail(token, toEmail.trim());
  }
}
