import type {
  SaveServiceRequestCommentInput,
  ServiceRequest,
  ServiceRequestComment,
} from "../entities/service-request";

export interface ServiceRequestsRepository {
  listRequests(token: string): Promise<ServiceRequest[]>;
  getRequestById(token: string, requestId: string): Promise<ServiceRequest>;
  listRequestComments(token: string, requestId: string): Promise<ServiceRequestComment[]>;
  updateRequestStatus(
    token: string,
    requestId: string,
    status: "concluida" | "cancelada",
  ): Promise<ServiceRequest>;
  createComment(
    token: string,
    requestId: string,
    input: SaveServiceRequestCommentInput,
  ): Promise<ServiceRequestComment>;
  updateComment(
    token: string,
    requestId: string,
    commentId: string,
    input: SaveServiceRequestCommentInput,
  ): Promise<ServiceRequestComment>;
  deleteComment(token: string, requestId: string, commentId: string): Promise<void>;
  deleteCommentFile(
    token: string,
    requestId: string,
    commentId: string,
    fileId: string,
  ): Promise<void>;
}
