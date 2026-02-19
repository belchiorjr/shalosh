import type { SecurityTokenProvider } from "@/modules/security/application/ports/security-token-provider";
import {
  ServiceRequestsMissingSessionError,
  ServiceRequestsValidationError,
} from "../../domain/errors/service-requests-errors";
import type {
  SaveServiceRequestCommentInput,
  ServiceRequest,
  ServiceRequestComment,
} from "../../domain/entities/service-request";
import type { ServiceRequestsRepository } from "../../domain/repositories/service-requests-repository";

export interface ServiceRequestDetails {
  request: ServiceRequest;
  comments: ServiceRequestComment[];
}

export class ManageServiceRequestsUseCase {
  constructor(
    private readonly repository: ServiceRequestsRepository,
    private readonly tokenProvider: SecurityTokenProvider,
  ) {}

  async list(): Promise<ServiceRequest[]> {
    return this.repository.listRequests(this.requireToken());
  }

  async getDetails(requestId: string): Promise<ServiceRequestDetails> {
    const normalizedRequestId = requestId.trim();
    if (!normalizedRequestId) {
      throw new ServiceRequestsValidationError("Solicitacao invalida.");
    }

    const token = this.requireToken();
    const [request, comments] = await Promise.all([
      this.repository.getRequestById(token, normalizedRequestId),
      this.repository.listRequestComments(token, normalizedRequestId),
    ]);

    return {
      request,
      comments,
    };
  }

  async updateStatus(
    requestId: string,
    status: "concluida" | "cancelada",
  ): Promise<ServiceRequest> {
    const normalizedRequestId = requestId.trim();
    if (!normalizedRequestId) {
      throw new ServiceRequestsValidationError("Solicitacao invalida.");
    }

    return this.repository.updateRequestStatus(
      this.requireToken(),
      normalizedRequestId,
      status,
    );
  }

  async createComment(
    requestId: string,
    input: SaveServiceRequestCommentInput,
  ): Promise<ServiceRequestComment> {
    const normalizedInput = normalizeCommentInput(input);
    if (!normalizedInput.comment) {
      throw new ServiceRequestsValidationError("Comentario e obrigatorio.");
    }

    return this.repository.createComment(
      this.requireToken(),
      requestId.trim(),
      normalizedInput,
    );
  }

  async updateComment(
    requestId: string,
    commentId: string,
    input: SaveServiceRequestCommentInput,
  ): Promise<ServiceRequestComment> {
    const normalizedInput = normalizeCommentInput(input);
    if (!normalizedInput.comment) {
      throw new ServiceRequestsValidationError("Comentario e obrigatorio.");
    }

    return this.repository.updateComment(
      this.requireToken(),
      requestId.trim(),
      commentId.trim(),
      normalizedInput,
    );
  }

  async deleteComment(requestId: string, commentId: string): Promise<void> {
    const normalizedRequestId = requestId.trim();
    const normalizedCommentId = commentId.trim();

    if (!normalizedRequestId || !normalizedCommentId) {
      throw new ServiceRequestsValidationError("Comentario invalido.");
    }

    await this.repository.deleteComment(
      this.requireToken(),
      normalizedRequestId,
      normalizedCommentId,
    );
  }

  async deleteCommentFile(
    requestId: string,
    commentId: string,
    fileId: string,
  ): Promise<void> {
    const normalizedRequestId = requestId.trim();
    const normalizedCommentId = commentId.trim();
    const normalizedFileId = fileId.trim();

    if (!normalizedRequestId || !normalizedCommentId || !normalizedFileId) {
      throw new ServiceRequestsValidationError("Arquivo invalido.");
    }

    await this.repository.deleteCommentFile(
      this.requireToken(),
      normalizedRequestId,
      normalizedCommentId,
      normalizedFileId,
    );
  }

  private requireToken(): string {
    const token = this.tokenProvider.getToken().trim();
    if (!token) {
      throw new ServiceRequestsMissingSessionError();
    }
    return token;
  }
}

function normalizeCommentInput(
  input: SaveServiceRequestCommentInput,
): SaveServiceRequestCommentInput {
  return {
    parentCommentId: (input.parentCommentId || "").trim(),
    comment: (input.comment || "").trim(),
    files: (input.files || [])
      .map((file) => ({
        fileName: (file.fileName || "").trim(),
        fileKey: (file.fileKey || "").trim(),
        contentType: (file.contentType || "").trim(),
        notes: (file.notes || "").trim(),
      }))
      .filter((file) => file.fileName || file.fileKey),
  };
}
