export class ServiceRequestsApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "ServiceRequestsApiError";
  }
}

export class ServiceRequestsMissingSessionError extends Error {
  constructor() {
    super("Sessao invalida. Faca login novamente.");
    this.name = "ServiceRequestsMissingSessionError";
  }
}

export class ServiceRequestsValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ServiceRequestsValidationError";
  }
}

export class ServiceRequestsUnexpectedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ServiceRequestsUnexpectedError";
  }
}
