export class MissingEmailSettingsSessionError extends Error {
  constructor() {
    super("Missing session token.");
    this.name = "MissingEmailSettingsSessionError";
  }
}

export class EmailSettingsServiceUnavailableError extends Error {
  constructor() {
    super("Email settings service unavailable.");
    this.name = "EmailSettingsServiceUnavailableError";
  }
}

export class EmailSettingsNotConfiguredError extends Error {
  constructor(message = "Email settings not configured.") {
    super(message);
    this.name = "EmailSettingsNotConfiguredError";
  }
}

export class UnexpectedEmailSettingsError extends Error {
  constructor(message = "Unexpected email settings error.") {
    super(message);
    this.name = "UnexpectedEmailSettingsError";
  }
}
