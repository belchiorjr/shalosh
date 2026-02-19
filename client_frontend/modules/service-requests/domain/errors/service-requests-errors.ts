export class ServiceRequestsApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "ServiceRequestsApiError";
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
