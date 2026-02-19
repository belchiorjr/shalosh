import {
  ServiceRequestsValidationError,
} from "../../domain/errors/service-requests-errors";
import type {
  CreateServiceRequestInput,
  SaveServiceRequestCommentInput,
  ServiceRequest,
  ServiceRequestComment,
} from "../../domain/entities/service-request";
import type { ServiceRequestsRepository } from "../../domain/repositories/service-requests-repository";

export class ManageServiceRequestsUseCase {
  constructor(private readonly repository: ServiceRequestsRepository) {}

  list(): Promise<ServiceRequest[]> {
    return this.repository.listRequests();
  }

  create(input: CreateServiceRequestInput): Promise<ServiceRequest> {
    const normalizedInput = normalizeCreateInput(input);
    if (!normalizedInput.description) {
      throw new ServiceRequestsValidationError("Descreva a solicitacao.");
    }

    return this.repository.createRequest(normalizedInput);
  }

  cancel(requestId: string): Promise<ServiceRequest> {
    const normalizedRequestId = requestId.trim();
    if (!normalizedRequestId) {
      throw new ServiceRequestsValidationError("Solicitacao invalida.");
    }

    return this.repository.cancelRequest(normalizedRequestId);
  }

  listComments(requestId: string): Promise<ServiceRequestComment[]> {
    const normalizedRequestId = requestId.trim();
    if (!normalizedRequestId) {
      throw new ServiceRequestsValidationError("Solicitacao invalida.");
    }

    return this.repository.listComments(normalizedRequestId);
  }

  createComment(
    requestId: string,
    input: SaveServiceRequestCommentInput,
  ): Promise<ServiceRequestComment> {
    const normalizedRequestId = requestId.trim();
    const normalizedInput = normalizeCommentInput(input);
    if (!normalizedInput.comment) {
      throw new ServiceRequestsValidationError("Informe um comentario.");
    }

    return this.repository.createComment(normalizedRequestId, normalizedInput);
  }

  updateComment(
    requestId: string,
    commentId: string,
    input: SaveServiceRequestCommentInput,
  ): Promise<ServiceRequestComment> {
    const normalizedRequestId = requestId.trim();
    const normalizedCommentId = commentId.trim();
    const normalizedInput = normalizeCommentInput(input);

    if (!normalizedInput.comment) {
      throw new ServiceRequestsValidationError("Informe um comentario.");
    }

    if (!normalizedCommentId) {
      throw new ServiceRequestsValidationError("Comentario invalido.");
    }

    return this.repository.updateComment(
      normalizedRequestId,
      normalizedCommentId,
      normalizedInput,
    );
  }

  deleteComment(requestId: string, commentId: string): Promise<void> {
    const normalizedRequestId = requestId.trim();
    const normalizedCommentId = commentId.trim();
    if (!normalizedRequestId || !normalizedCommentId) {
      throw new ServiceRequestsValidationError("Comentario invalido.");
    }

    return this.repository.deleteComment(normalizedRequestId, normalizedCommentId);
  }

  deleteCommentFile(requestId: string, commentId: string, fileId: string): Promise<void> {
    const normalizedRequestId = requestId.trim();
    const normalizedCommentId = commentId.trim();
    const normalizedFileId = fileId.trim();
    if (!normalizedRequestId || !normalizedCommentId || !normalizedFileId) {
      throw new ServiceRequestsValidationError("Arquivo invalido.");
    }

    return this.repository.deleteCommentFile(
      normalizedRequestId,
      normalizedCommentId,
      normalizedFileId,
    );
  }
}

function normalizeCreateInput(input: CreateServiceRequestInput): CreateServiceRequestInput {
  return {
    title: (input.title || "").trim(),
    description: (input.description || "").trim(),
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
