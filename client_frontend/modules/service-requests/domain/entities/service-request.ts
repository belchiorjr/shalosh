export interface ServiceRequestFile {
  id: string;
  fileName: string;
  fileKey: string;
  contentType: string;
  notes: string;
}

export interface ServiceRequestCommentFile {
  id: string;
  fileName: string;
  fileKey: string;
  contentType: string;
  notes: string;
}

export interface ServiceRequestComment {
  id: string;
  serviceRequestId: string;
  parentCommentId?: string;
  userId?: string;
  clientId?: string;
  authorName?: string;
  authorAvatar?: string;
  authorType?: string;
  comment: string;
  files: ServiceRequestCommentFile[];
  created: string;
}

export interface ServiceRequest {
  id: string;
  title: string;
  description: string;
  status: string;
  files: ServiceRequestFile[];
  created: string;
}

export interface RelatedFileInput {
  fileName: string;
  fileKey: string;
  contentType: string;
  notes: string;
}

export interface CreateServiceRequestInput {
  title: string;
  description: string;
  files: RelatedFileInput[];
}

export interface SaveServiceRequestCommentInput {
  parentCommentId?: string;
  comment: string;
  files: RelatedFileInput[];
}
