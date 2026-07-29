import { MissingEmailSettingsSessionError } from "../../domain/errors/email-settings-errors";
import type { EmailSettings } from "../../domain/entities/email-settings";
import type {
  EmailSettingsRepository,
  SaveEmailSettingsInput,
} from "../../domain/repositories/email-settings-repository";
import type { EmailSettingsTokenProvider } from "../ports/email-settings-token-provider";

export class SaveEmailSettingsUseCase {
  constructor(
    private readonly emailSettingsRepository: EmailSettingsRepository,
    private readonly tokenProvider: EmailSettingsTokenProvider,
  ) {}

  async execute(input: SaveEmailSettingsInput): Promise<EmailSettings> {
    const token = this.tokenProvider.getToken().trim();
    if (!token) {
      throw new MissingEmailSettingsSessionError();
    }

    return this.emailSettingsRepository.saveEmailSettings(token, {
      ...input,
      apiUrl: input.apiUrl.trim(),
      authUser: input.authUser.trim(),
      authPassword: input.authPassword.trim(),
      fromEmail: input.fromEmail.trim().toLowerCase(),
      fromName: input.fromName.trim(),
      adminResetUrl: input.adminResetUrl.trim(),
      clientResetUrl: input.clientResetUrl.trim(),
    });
  }
}
