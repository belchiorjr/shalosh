export class MissingSecuritySessionError extends Error {
  constructor() {
    super("Missing security session token.");
    this.name = "MissingSecuritySessionError";
  }
}

export class SecurityServiceUnavailableError extends Error {
  constructor() {
    super("Security service unavailable.");
    this.name = "SecurityServiceUnavailableError";
  }
}

export class UnexpectedSecurityError extends Error {
  constructor(message = "Unexpected security error.") {
    super(message);
    this.name = "UnexpectedSecurityError";
  }
}

