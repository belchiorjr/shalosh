import { MissingSecuritySessionError } from "../../domain/errors/security-errors";
import type {
  CurrentUserSecurityContext,
  SecurityRepository,
} from "../../domain/repositories/security-repository";
import type { SecurityTokenProvider } from "../ports/security-token-provider";

export class GetCurrentUserSecurityContextUseCase {
  constructor(
    private readonly securityRepository: SecurityRepository,
    private readonly tokenProvider: SecurityTokenProvider,
  ) {}

  async execute(): Promise<CurrentUserSecurityContext> {
    const token = this.tokenProvider.getToken().trim();
    if (!token) {
      throw new MissingSecuritySessionError();
    }

    return this.securityRepository.getCurrentUserSecurityContext(token);
  }
}

