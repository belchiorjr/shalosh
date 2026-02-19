export interface ServiceRequestFile {
  id: string;
  fileName: string;
  fileKey: string;
  contentType: string;
  notes: string;
  created?: string;
  updated?: string;
}

export interface ServiceRequestCommentFile {
  id: string;
  fileName: string;
  fileKey: string;
  contentType: string;
  notes: string;
  created?: string;
  updated?: string;
}

export interface ServiceRequestComment {
  id: string;
  serviceRequestId: string;
  parentCommentId?: string;
  userId?: string;
  clientId?: string;
  authorName: string;
  authorAvatar?: string;
  authorType: string;
  comment: string;
  files: ServiceRequestCommentFile[];
  created?: string;
  updated?: string;
}

export interface ServiceRequest {
  id: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  clientLogin: string;
  projectId?: string;
  projectName?: string;
  title: string;
  description: string;
  status: string;
  files: ServiceRequestFile[];
  comments: number;
  openComments: number;
  created?: string;
  updated?: string;
}

export interface RelatedFileInput {
  fileName: string;
  fileKey: string;
  contentType: string;
  notes: string;
}

export interface SaveServiceRequestCommentInput {
  parentCommentId?: string;
  comment: string;
  files: RelatedFileInput[];
}
