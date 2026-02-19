import { ManageServiceRequestsUseCase } from "../application/use-cases/manage-service-requests-use-case";
import { HttpServiceRequestsRepository } from "../infrastructure/http-service-requests-repository";

export function createServiceRequestsUseCase() {
  const repository = new HttpServiceRequestsRepository();
  return new ManageServiceRequestsUseCase(repository);
}
