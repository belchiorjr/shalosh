import type {
  CreateServiceRequestInput,
  SaveServiceRequestCommentInput,
  ServiceRequest,
  ServiceRequestComment,
} from "../entities/service-request";

export interface ServiceRequestsRepository {
  listRequests(): Promise<ServiceRequest[]>;
  createRequest(input: CreateServiceRequestInput): Promise<ServiceRequest>;
  cancelRequest(requestId: string): Promise<ServiceRequest>;

  listComments(requestId: string): Promise<ServiceRequestComment[]>;
  createComment(
    requestId: string,
    input: SaveServiceRequestCommentInput,
  ): Promise<ServiceRequestComment>;
  updateComment(
    requestId: string,
    commentId: string,
    input: SaveServiceRequestCommentInput,
  ): Promise<ServiceRequestComment>;
  deleteComment(requestId: string, commentId: string): Promise<void>;
  deleteCommentFile(requestId: string, commentId: string, fileId: string): Promise<void>;
}
