import type {
  HttpClient,
  HttpRequest,
} from "@/modules/shared/infrastructure/http/http-client";
import {
  ServiceRequestsApiError,
  ServiceRequestsUnexpectedError,
} from "../domain/errors/service-requests-errors";
import type {
  SaveServiceRequestCommentInput,
  ServiceRequest,
  ServiceRequestComment,
} from "../domain/entities/service-request";
import type { ServiceRequestsRepository } from "../domain/repositories/service-requests-repository";

interface ErrorApiResponse {
  error?: string;
}

export class HttpServiceRequestsRepository implements ServiceRequestsRepository {
  constructor(
    private readonly baseUrl: string,
    private readonly httpClient: HttpClient,
  ) {}

  listRequests(token: string): Promise<ServiceRequest[]> {
    return this.request<ServiceRequest[]>(
      {
        url: this.buildUrl("/service-requests"),
        method: "GET",
        headers: this.withAuthHeaders(token),
      },
      "Nao foi possivel carregar as solicitacoes.",
    );
  }

  getRequestById(token: string, requestId: string): Promise<ServiceRequest> {
    return this.request<ServiceRequest>(
      {
        url: this.buildUrl(`/service-requests/${requestId}`),
        method: "GET",
        headers: this.withAuthHeaders(token),
      },
      "Nao foi possivel carregar os detalhes da solicitacao.",
    );
  }

  listRequestComments(token: string, requestId: string): Promise<ServiceRequestComment[]> {
    return this.request<ServiceRequestComment[]>(
      {
        url: this.buildUrl(`/service-requests/${requestId}/comments`),
        method: "GET",
        headers: this.withAuthHeaders(token),
      },
      "Nao foi possivel carregar os comentarios da solicitacao.",
    );
  }

  updateRequestStatus(
    token: string,
    requestId: string,
    status: "concluida" | "cancelada",
  ): Promise<ServiceRequest> {
    return this.request<ServiceRequest, { status: "concluida" | "cancelada" }>(
      {
        url: this.buildUrl(`/service-requests/${requestId}/status`),
        method: "PATCH",
        headers: this.withAuthHeaders(token, true),
        body: { status },
      },
      "Nao foi possivel atualizar a solicitacao.",
    );
  }

  createComment(
    token: string,
    requestId: string,
    input: SaveServiceRequestCommentInput,
  ): Promise<ServiceRequestComment> {
    return this.request<ServiceRequestComment, SaveServiceRequestCommentInput>(
      {
        url: this.buildUrl(`/service-requests/${requestId}/comments`),
        method: "POST",
        headers: this.withAuthHeaders(token, true),
        body: input,
      },
      "Nao foi possivel salvar o comentario.",
    );
  }

  updateComment(
    token: string,
    requestId: string,
    commentId: string,
    input: SaveServiceRequestCommentInput,
  ): Promise<ServiceRequestComment> {
    return this.request<ServiceRequestComment, SaveServiceRequestCommentInput>(
      {
        url: this.buildUrl(`/service-requests/${requestId}/comments/${commentId}`),
        method: "PATCH",
        headers: this.withAuthHeaders(token, true),
        body: input,
      },
      "Nao foi possivel atualizar o comentario.",
    );
  }

  async deleteComment(token: string, requestId: string, commentId: string): Promise<void> {
    await this.request<unknown>(
      {
        url: this.buildUrl(`/service-requests/${requestId}/comments/${commentId}`),
        method: "DELETE",
        headers: this.withAuthHeaders(token),
      },
      "Nao foi possivel excluir o comentario.",
    );
  }

  async deleteCommentFile(
    token: string,
    requestId: string,
    commentId: string,
    fileId: string,
  ): Promise<void> {
    await this.request<unknown>(
      {
        url: this.buildUrl(`/service-requests/${requestId}/comments/${commentId}/files/${fileId}`),
        method: "DELETE",
        headers: this.withAuthHeaders(token),
      },
      "Nao foi possivel excluir o arquivo.",
    );
  }

  private async request<TResponse, TBody = unknown>(
    request: HttpRequest<TBody>,
    fallbackErrorMessage: string,
  ): Promise<TResponse> {
    try {
      const response = await this.httpClient.request<TResponse | ErrorApiResponse, TBody>(
        request,
      );

      if (response.status < 200 || response.status >= 300) {
        throw new ServiceRequestsApiError(
          getApiErrorMessage(response.data, fallbackErrorMessage),
          response.status,
        );
      }

      return response.data as TResponse;
    } catch (cause) {
      if (cause instanceof ServiceRequestsApiError) {
        throw cause;
      }

      throw new ServiceRequestsUnexpectedError(fallbackErrorMessage);
    }
  }

  private withAuthHeaders(
    token: string,
    withContentType = false,
  ): Record<string, string> {
    return {
      ...(withContentType ? { "Content-Type": "application/json" } : {}),
      Authorization: `Bearer ${token}`,
    };
  }

  private buildUrl(path: string): string {
    return `${this.baseUrl}${path}`;
  }
}

function getApiErrorMessage(payload: unknown, fallback: string): string {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "error" in payload &&
    typeof (payload as { error?: unknown }).error === "string"
  ) {
    const message = ((payload as { error: string }).error || "").trim();
    if (message) {
      return message;
    }
  }

  return fallback;
}
