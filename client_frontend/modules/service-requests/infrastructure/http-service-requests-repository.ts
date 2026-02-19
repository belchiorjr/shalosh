import { ClientApiError, fetchClientApi } from "@/lib/client-api";
import {
  ServiceRequestsApiError,
  ServiceRequestsUnexpectedError,
} from "../domain/errors/service-requests-errors";
import type {
  CreateServiceRequestInput,
  SaveServiceRequestCommentInput,
  ServiceRequest,
  ServiceRequestComment,
} from "../domain/entities/service-request";
import type { ServiceRequestsRepository } from "../domain/repositories/service-requests-repository";

export class HttpServiceRequestsRepository implements ServiceRequestsRepository {
  async listRequests(): Promise<ServiceRequest[]> {
    return this.wrapRequest(
      async () => fetchClientApi<ServiceRequest[]>("/client/service-requests"),
      "Falha de conexao com a API.",
    );
  }

  async createRequest(input: CreateServiceRequestInput): Promise<ServiceRequest> {
    return this.wrapRequest(
      async () =>
        fetchClientApi<ServiceRequest>("/client/service-requests", {
          method: "POST",
          body: JSON.stringify(input),
        }),
      "Falha de conexao com a API.",
    );
  }

  async cancelRequest(requestId: string): Promise<ServiceRequest> {
    return this.wrapRequest(
      async () =>
        fetchClientApi<ServiceRequest>(`/client/service-requests/${requestId}`, {
          method: "PATCH",
        }),
      "Falha de conexao com a API.",
    );
  }

  async listComments(requestId: string): Promise<ServiceRequestComment[]> {
    return this.wrapRequest(
      async () =>
        fetchClientApi<ServiceRequestComment[]>(
          `/client/service-requests/${requestId}/comments`,
        ),
      "Falha de conexao com a API.",
    );
  }

  async createComment(
    requestId: string,
    input: SaveServiceRequestCommentInput,
  ): Promise<ServiceRequestComment> {
    return this.wrapRequest(
      async () =>
        fetchClientApi<ServiceRequestComment>(
          `/client/service-requests/${requestId}/comments`,
          {
            method: "POST",
            body: JSON.stringify(input),
          },
        ),
      "Falha de conexao com a API.",
    );
  }

  async updateComment(
    requestId: string,
    commentId: string,
    input: SaveServiceRequestCommentInput,
  ): Promise<ServiceRequestComment> {
    return this.wrapRequest(
      async () =>
        fetchClientApi<ServiceRequestComment>(
          `/client/service-requests/${requestId}/comments/${commentId}`,
          {
            method: "PATCH",
            body: JSON.stringify(input),
          },
        ),
      "Falha de conexao com a API.",
    );
  }

  async deleteComment(requestId: string, commentId: string): Promise<void> {
    await this.wrapRequest(
      async () =>
        fetchClientApi(
          `/client/service-requests/${requestId}/comments/${commentId}`,
          {
            method: "DELETE",
          },
        ),
      "Falha de conexao com a API.",
    );
  }

  async deleteCommentFile(requestId: string, commentId: string, fileId: string): Promise<void> {
    await this.wrapRequest(
      async () =>
        fetchClientApi(
          `/client/service-requests/${requestId}/comments/${commentId}/files/${fileId}`,
          {
            method: "DELETE",
          },
        ),
      "Falha de conexao com a API.",
    );
  }

  private async wrapRequest<TResponse>(
    fn: () => Promise<TResponse>,
    fallbackErrorMessage: string,
  ): Promise<TResponse> {
    try {
      return await fn();
    } catch (cause) {
      if (cause instanceof ClientApiError) {
        throw new ServiceRequestsApiError(cause.message, cause.status);
      }

      if (cause instanceof ServiceRequestsApiError) {
        throw cause;
      }

      throw new ServiceRequestsUnexpectedError(fallbackErrorMessage);
    }
  }
}
