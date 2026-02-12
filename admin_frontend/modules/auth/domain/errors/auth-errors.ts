export class MissingCredentialsError extends Error {
  constructor() {
    super("Login and password are required.");
    this.name = "MissingCredentialsError";
  }
}

export class InvalidCredentialsError extends Error {
  constructor() {
    super("Invalid credentials.");
    this.name = "InvalidCredentialsError";
  }
}

export class AuthServiceUnavailableError extends Error {
  constructor() {
    super("Authentication service unavailable.");
    this.name = "AuthServiceUnavailableError";
  }
}

export class UnexpectedAuthError extends Error {
  constructor(message = "Unexpected authentication error.") {
    super(message);
    this.name = "UnexpectedAuthError";
  }
}
