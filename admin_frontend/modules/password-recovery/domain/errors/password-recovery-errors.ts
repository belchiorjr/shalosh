export class PasswordRecoveryServiceUnavailableError extends Error {
  constructor() {
    super("Password recovery service unavailable.");
    this.name = "PasswordRecoveryServiceUnavailableError";
  }
}

export class InvalidPasswordRecoveryInputError extends Error {
  constructor(message = "Invalid password recovery input.") {
    super(message);
    this.name = "InvalidPasswordRecoveryInputError";
  }
}

export class UnexpectedPasswordRecoveryError extends Error {
  constructor(message = "Unexpected password recovery error.") {
    super(message);
    this.name = "UnexpectedPasswordRecoveryError";
  }
}
