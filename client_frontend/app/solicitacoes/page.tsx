"use client";

import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@heroui/dropdown";
import { Input, Textarea } from "@heroui/input";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/modal";
import { Spinner } from "@heroui/spinner";
import {
  ChangeEvent,
  DragEvent,
  MouseEvent as ReactMouseEvent,
  WheelEvent as ReactWheelEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { MaterialSymbol } from "@/components/material-symbol";
import { readClientProfile } from "@/lib/client-auth";
import { createServiceRequestsUseCase } from "@/modules/service-requests/composition/create-service-requests-use-case";
import type {
  ServiceRequest,
  ServiceRequestComment,
} from "@/modules/service-requests/domain/entities/service-request";
import {
  ServiceRequestsApiError,
  ServiceRequestsUnexpectedError,
  ServiceRequestsValidationError,
} from "@/modules/service-requests/domain/errors/service-requests-errors";


interface FileForm {
  fileName: string;
  fileKey: string;
  contentType: string;
  notes: string;
  previewUrl: string;
}

interface FilePreviewState {
  fileName: string;
  fileKey: string;
  contentType: string;
  previewUrl: string;
  deleteAction: FilePreviewDeleteAction;
}

type FilePickerTarget = "request" | "comment";
type FilePreviewDeleteAction =
  | { type: "none" }
  | { type: "draft-request-file"; index: number }
  | { type: "draft-comment-file"; index: number }
  | {
      type: "comment-file";
      requestId: string;
      commentId: string;
      fileId: string;
      canDelete: boolean;
    };

function createEmptyFile(): FileForm {
  return {
    fileName: "",
    fileKey: "",
    contentType: "",
    notes: "",
    previewUrl: "",
  };
}

export default function SolicitacoesPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCancellingId, setIsCancellingId] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);
  const [isCommentComposerOpen, setIsCommentComposerOpen] = useState(false);
  const [isFilePickerModalOpen, setIsFilePickerModalOpen] = useState(false);
  const [isFilePreviewModalOpen, setIsFilePreviewModalOpen] = useState(false);
  const [isDeletingPreviewFile, setIsDeletingPreviewFile] = useState(false);
  const [isDeletingCommentId, setIsDeletingCommentId] = useState("");
  const [editingCommentId, setEditingCommentId] = useState("");
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [commentsError, setCommentsError] = useState<string | null>(null);
  const [filePickerError, setFilePickerError] = useState<string | null>(null);
  const [filePreviewError, setFilePreviewError] = useState<string | null>(null);

  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [comments, setComments] = useState<ServiceRequestComment[]>([]);
  const [hoveredReplyCommentId, setHoveredReplyCommentId] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<FileForm[]>([]);
  const [filePickerTarget, setFilePickerTarget] = useState<FilePickerTarget>("request");
  const [selectedLocalFile, setSelectedLocalFile] = useState<File | null>(null);
  const [selectedFilePreviewUrl, setSelectedFilePreviewUrl] = useState("");
  const [pendingFile, setPendingFile] = useState<FileForm>(createEmptyFile());
  const [commentText, setCommentText] = useState("");
  const [commentParentId, setCommentParentId] = useState("");
  const [commentFiles, setCommentFiles] = useState<FileForm[]>([]);
  const [filePreview, setFilePreview] = useState<FilePreviewState | null>(null);
  const [imagePreviewZoom, setImagePreviewZoom] = useState(1);
  const [imagePreviewPan, setImagePreviewPan] = useState({ x: 0, y: 0 });
  const [isImagePreviewDragging, setIsImagePreviewDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imagePreviewDragRef = useRef({
    active: false,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
  });
  const imagePreviewPanRef = useRef({ x: 0, y: 0 });
  const imagePreviewPendingPanRef = useRef<{ x: number; y: number } | null>(null);
  const imagePreviewPanFrameRef = useRef<number | null>(null);
  const clientProfile = useMemo(() => readClientProfile(), []);
  const serviceRequestsUseCase = useMemo(() => createServiceRequestsUseCase(), []);
  const currentClientID = (clientProfile?.id || "").trim();

  useEffect(() => {
    void loadData();
  }, []);

  useEffect(() => {
    return () => {
      releaseFilePreview(selectedFilePreviewUrl);
    };
  }, [selectedFilePreviewUrl]);
  useEffect(() => {
    imagePreviewPanRef.current = imagePreviewPan;
  }, [imagePreviewPan]);
  useEffect(() => {
    return () => {
      if (imagePreviewPanFrameRef.current !== null) {
        window.cancelAnimationFrame(imagePreviewPanFrameRef.current);
      }
    };
  }, []);

  const selectedReplyComment = useMemo(
    () => comments.find((comment) => comment.id === commentParentId) || null,
    [comments, commentParentId],
  );
  const selectedEditingComment = useMemo(
    () => comments.find((comment) => comment.id === editingCommentId) || null,
    [comments, editingCommentId],
  );
  const isEditingComment = editingCommentId.trim() !== "";

  const commentsByID = useMemo(() => {
    const commentMap = new Map<string, ServiceRequestComment>();
    comments.forEach((comment) => {
      commentMap.set(comment.id, comment);
    });
    return commentMap;
  }, [comments]);

  const orderedComments = useMemo(() => orderCommentsWithReplies(comments), [comments]);

  const selectedFilePreviewType = useMemo(
    () =>
      resolveFilePreviewType(
        pendingFile.contentType,
        pendingFile.fileName,
        pendingFile.previewUrl,
        pendingFile.fileKey,
      ),
    [pendingFile.contentType, pendingFile.fileName, pendingFile.previewUrl, pendingFile.fileKey],
  );

  const selectedModalFilePreviewType = useMemo(
    () =>
      resolveFilePreviewType(
        filePreview?.contentType || "",
        filePreview?.fileName || "",
        filePreview?.previewUrl || "",
        filePreview?.fileKey || "",
      ),
    [
      filePreview?.contentType,
      filePreview?.fileName,
      filePreview?.previewUrl,
      filePreview?.fileKey,
    ],
  );
  const filePreviewResolvedUrl = useMemo(() => {
    if (!filePreview) {
      return "";
    }

    return resolveFilePreviewUrl(filePreview.previewUrl, filePreview.fileKey);
  }, [filePreview]);
  const filePreviewOpenUrl = useMemo(() => {
    if (!filePreviewResolvedUrl) {
      return "";
    }

    if (isDataUrl(filePreviewResolvedUrl)) {
      return convertDataUrlToBlobUrl(filePreviewResolvedUrl);
    }

    return filePreviewResolvedUrl;
  }, [filePreviewResolvedUrl]);
  useEffect(() => {
    if (!filePreviewOpenUrl.startsWith("blob:")) {
      return;
    }

    return () => {
      URL.revokeObjectURL(filePreviewOpenUrl);
    };
  }, [filePreviewOpenUrl]);
  const zoomOutImagePreview = () => {
    setImagePreviewZoom((currentZoom) => Math.max(1, Number((currentZoom - 0.25).toFixed(2))));
  };
  const zoomInImagePreview = () => {
    setImagePreviewZoom((currentZoom) => Math.min(5, Number((currentZoom + 0.25).toFixed(2))));
  };
  const queueImagePreviewPan = (nextPan: { x: number; y: number }) => {
    imagePreviewPendingPanRef.current = nextPan;
    if (imagePreviewPanFrameRef.current !== null) {
      return;
    }

    imagePreviewPanFrameRef.current = window.requestAnimationFrame(() => {
      imagePreviewPanFrameRef.current = null;
      const pendingPan = imagePreviewPendingPanRef.current;
      if (!pendingPan) {
        return;
      }
      imagePreviewPendingPanRef.current = null;
      imagePreviewPanRef.current = pendingPan;
      setImagePreviewPan(pendingPan);
    });
  };
  const resetImagePreviewPanState = () => {
    if (imagePreviewPanFrameRef.current !== null) {
      window.cancelAnimationFrame(imagePreviewPanFrameRef.current);
      imagePreviewPanFrameRef.current = null;
    }
    imagePreviewPendingPanRef.current = null;
    imagePreviewPanRef.current = { x: 0, y: 0 };
    setImagePreviewPan({ x: 0, y: 0 });
    setIsImagePreviewDragging(false);
    imagePreviewDragRef.current.active = false;
  };
  const resetImagePreviewZoom = () => {
    setImagePreviewZoom(1);
    resetImagePreviewPanState();
  };
  const onImagePreviewWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    if (selectedModalFilePreviewType !== "image") {
      return;
    }
    event.preventDefault();

    const shouldZoom =
      event.ctrlKey || event.metaKey || event.altKey || imagePreviewZoom <= 1;
    if (shouldZoom) {
      const zoomDelta = event.deltaY < 0 ? 0.15 : -0.15;
      setImagePreviewZoom((currentZoom) =>
        Math.min(5, Math.max(1, Number((currentZoom + zoomDelta).toFixed(2)))),
      );
      return;
    }

    queueImagePreviewPan({
      x: imagePreviewPanRef.current.x - event.deltaX,
      y: imagePreviewPanRef.current.y - event.deltaY,
    });
  };
  const onImagePreviewMouseDown = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (selectedModalFilePreviewType !== "image" || imagePreviewZoom <= 1) {
      return;
    }

    event.preventDefault();
    imagePreviewDragRef.current = {
      active: true,
      startX: event.clientX,
      startY: event.clientY,
      originX: imagePreviewPanRef.current.x,
      originY: imagePreviewPanRef.current.y,
    };
    setIsImagePreviewDragging(true);
  };
  const onImagePreviewMouseMove = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (!imagePreviewDragRef.current.active) {
      return;
    }

    event.preventDefault();
    const deltaX = event.clientX - imagePreviewDragRef.current.startX;
    const deltaY = event.clientY - imagePreviewDragRef.current.startY;
    queueImagePreviewPan({
      x: imagePreviewDragRef.current.originX + deltaX,
      y: imagePreviewDragRef.current.originY + deltaY,
    });
  };
  const onImagePreviewMouseUp = () => {
    if (!imagePreviewDragRef.current.active) {
      return;
    }

    imagePreviewDragRef.current.active = false;
    setIsImagePreviewDragging(false);
  };
  useEffect(() => {
    if (imagePreviewZoom > 1) {
      return;
    }

    resetImagePreviewPanState();
  }, [imagePreviewZoom]);

  const requestMetrics = useMemo(() => {
    const metrics = {
      total: requests.length,
      open: 0,
      inProgress: 0,
      concluded: 0,
      cancelled: 0,
    };

    for (const request of requests) {
      const normalizedStatus = normalizeServiceRequestStatus(request.status);
      if (normalizedStatus === "aberta") {
        metrics.open += 1;
        continue;
      }
      if (normalizedStatus === "em_andamento") {
        metrics.inProgress += 1;
        continue;
      }
      if (normalizedStatus === "concluida") {
        metrics.concluded += 1;
        continue;
      }
      if (normalizedStatus === "cancelada") {
        metrics.cancelled += 1;
      }
    }

    return metrics;
  }, [requests]);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const requestsPayload = await serviceRequestsUseCase.list();
      setRequests(Array.isArray(requestsPayload) ? requestsPayload : []);
    } catch (cause) {
      setError(getServiceRequestsErrorMessage(cause, "Falha de conexão com a API."));
    } finally {
      setIsLoading(false);
    }
  };

  const loadComments = async (requestId: string) => {
    setIsLoadingComments(true);
    setCommentsError(null);

    try {
      const payload = await serviceRequestsUseCase.listComments(requestId);
      setComments(Array.isArray(payload) ? payload : []);
    } catch (cause) {
      setCommentsError(
        getServiceRequestsErrorMessage(cause, "Falha de conexão com a API."),
      );
    } finally {
      setIsLoadingComments(false);
    }
  };

  const openCommentsModal = async (request: ServiceRequest) => {
    setSelectedRequest(request);
    setComments([]);
    setCommentText("");
    setCommentParentId("");
    setCommentFiles([]);
    setEditingCommentId("");
    setCommentsError(null);
    setIsDeletingCommentId("");
    setIsCommentComposerOpen(false);
    setIsCommentsModalOpen(true);
    await loadComments(request.id);
  };

  const openFilePicker = (target: FilePickerTarget) => {
    setFilePickerTarget(target);
    setSelectedLocalFile(null);
    setPendingFile(createEmptyFile());
    setFilePickerError(null);
    releaseFilePreview(selectedFilePreviewUrl);
    setSelectedFilePreviewUrl("");
    setIsDraggingFile(false);
    setIsFilePickerModalOpen(true);
  };

  const closeFilePicker = () => {
    releaseFilePreview(selectedFilePreviewUrl);
    setSelectedFilePreviewUrl("");
    setSelectedLocalFile(null);
    setPendingFile(createEmptyFile());
    setFilePickerError(null);
    setIsDraggingFile(false);
    setIsFilePickerModalOpen(false);
  };

  const openFilePreviewModal = (file: {
    fileName?: string;
    fileKey?: string;
    contentType?: string;
    previewUrl?: string;
  }, deleteAction: FilePreviewDeleteAction = { type: "none" }) => {
    const fileName = (file.fileName || "").trim() || "arquivo";
    const fileKey = (file.fileKey || "").trim();
    const contentType = (file.contentType || "").trim();
    const previewUrl = resolveFilePreviewUrl(file.previewUrl || "", fileKey);

    setFilePreviewError(null);
    setFilePreview({
      fileName,
      fileKey,
      contentType,
      previewUrl,
      deleteAction,
    });
    setImagePreviewZoom(1);
    resetImagePreviewPanState();
    setIsFilePreviewModalOpen(true);
  };

  const onFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (!file) {
      return;
    }
    void loadSelectedFile(file);
    event.target.value = "";
  };

  const onFileDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingFile(false);
    const file = event.dataTransfer.files?.[0] || null;
    if (!file) {
      return;
    }
    void loadSelectedFile(file);
  };

  const loadSelectedFile = async (file: File) => {
    const normalizedName = normalizeFileNameForKey(file.name);
    const generatedKey = generateFileStorageKey(normalizedName);
    const previewUrl = await buildPreviewDataUrl(file);

    releaseFilePreview(selectedFilePreviewUrl);
    setSelectedLocalFile(file);
    setPendingFile({
      fileName: file.name,
      fileKey: generatedKey,
      contentType: file.type || "",
      notes: "",
      previewUrl,
    });
    setSelectedFilePreviewUrl(previewUrl);
    setFilePickerError(null);
  };

  const confirmAddPickedFile = () => {
    const normalizedFileName = pendingFile.fileName.trim();
    if (!normalizedFileName) {
      setFilePickerError("Selecione um arquivo para adicionar.");
      return;
    }

    const normalizedPreviewUrl = (
      pendingFile.previewUrl || selectedFilePreviewUrl
    ).trim();
    const normalizedFileKey =
      normalizedPreviewUrl ||
      pendingFile.fileKey.trim() ||
      generateFileStorageKey(normalizeFileNameForKey(normalizedFileName));

    const normalizedFile: FileForm = {
      fileName: normalizedFileName,
      fileKey: normalizedFileKey,
      contentType: pendingFile.contentType.trim(),
      notes: pendingFile.notes.trim(),
      previewUrl: pendingFile.previewUrl || selectedFilePreviewUrl || "",
    };

    if (filePickerTarget === "request") {
      setFiles((current) => [...current, normalizedFile]);
    } else {
      setCommentFiles((current) => [...current, normalizedFile]);
    }

    closeFilePicker();
  };

  const addFile = () => {
    openFilePicker("request");
  };

  const removeFile = (index: number) => {
    setFiles((current) => current.filter((_, currentIndex) => currentIndex !== index));
  };

  const addCommentFile = () => {
    openFilePicker("comment");
  };

  const removeCommentFile = (index: number) => {
    setCommentFiles((current) =>
      current.filter((_, currentIndex) => currentIndex !== index),
    );
  };

  const openNewCommentComposer = () => {
    setCommentText("");
    setCommentParentId("");
    setCommentFiles([]);
    setEditingCommentId("");
    setCommentsError(null);
    setIsCommentComposerOpen(true);
  };

  const openReplyCommentComposer = (parentCommentID: string) => {
    setCommentText("");
    setCommentParentId(parentCommentID);
    setCommentFiles([]);
    setEditingCommentId("");
    setCommentsError(null);
    setIsCommentComposerOpen(true);
  };

  const openEditCommentComposer = (comment: ServiceRequestComment) => {
    if (!canClientDeleteComment(comment, currentClientID)) {
      setCommentsError("Você só pode editar comentários criados por você.");
      return;
    }

    setCommentText(comment.comment || "");
    setCommentParentId(comment.parentCommentId || "");
    setCommentFiles([]);
    setEditingCommentId(comment.id);
    setCommentsError(null);
    setIsCommentComposerOpen(true);
  };

  const deleteComment = async (comment: ServiceRequestComment) => {
    const requestID = (comment.serviceRequestId || selectedRequest?.id || "").trim();
    if (!requestID) {
      setCommentsError("Não foi possível identificar a solicitação.");
      return;
    }

    if (!canClientDeleteComment(comment, currentClientID)) {
      setCommentsError("Você só pode excluir comentários criados por você.");
      return;
    }

    setIsDeletingCommentId(comment.id);
    setCommentsError(null);

    try {
      await serviceRequestsUseCase.deleteComment(requestID, comment.id);

      if (commentParentId === comment.id) {
        setCommentParentId("");
      }
      if (editingCommentId === comment.id) {
        setEditingCommentId("");
        setCommentText("");
        setCommentFiles([]);
        setIsCommentComposerOpen(false);
      }

      await loadComments(requestID);
      await loadData();
    } catch (cause) {
      setCommentsError(
        getServiceRequestsErrorMessage(cause, "Falha de conexão com a API."),
      );
    } finally {
      setIsDeletingCommentId("");
    }
  };

  const deletePreviewFile = async () => {
    if (!filePreview) {
      return;
    }

    const action = filePreview.deleteAction;
    if (action.type === "none") {
      return;
    }

    if (action.type === "comment-file" && !action.canDelete) {
      setFilePreviewError("Você só pode excluir anexos dos seus comentários.");
      return;
    }

    setIsDeletingPreviewFile(true);
    setFilePreviewError(null);

    try {
      if (action.type === "draft-request-file") {
        removeFile(action.index);
        setIsFilePreviewModalOpen(false);
        setFilePreview(null);
        return;
      }

      if (action.type === "draft-comment-file") {
        removeCommentFile(action.index);
        setIsFilePreviewModalOpen(false);
        setFilePreview(null);
        return;
      }

      if (action.type === "comment-file") {
        if (!action.requestId || !action.commentId || !action.fileId) {
          setFilePreviewError("Não foi possível identificar o arquivo.");
          return;
        }

        await serviceRequestsUseCase.deleteCommentFile(
          action.requestId,
          action.commentId,
          action.fileId,
        );

        setComments((currentComments) =>
          currentComments.map((comment) =>
            comment.id === action.commentId
              ? {
                  ...comment,
                  files: comment.files.filter((file) => file.id !== action.fileId),
                }
              : comment,
          ),
        );

        setIsFilePreviewModalOpen(false);
        setFilePreview(null);
      }
    } catch (cause) {
      setFilePreviewError(
        getServiceRequestsErrorMessage(cause, "Falha de conexão com a API."),
      );
    } finally {
      setIsDeletingPreviewFile(false);
    }
  };

  const submitRequest = async () => {
    if (!description.trim()) {
      setFormError("Descreva a solicitação.");
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    setError(null);

    const normalizedFiles = files
      .map((file) => ({
        fileName: file.fileName.trim(),
        fileKey: file.fileKey.trim(),
        contentType: file.contentType.trim(),
        notes: file.notes.trim(),
      }))
      .filter((file) => file.fileName || file.fileKey);

    try {
      await serviceRequestsUseCase.create({
        title: title.trim(),
        description: description.trim(),
        files: normalizedFiles,
      });

      setTitle("");
      setDescription("");
      setFiles([]);
      setIsCreateModalOpen(false);

      await loadData();
    } catch (cause) {
      setFormError(getServiceRequestsErrorMessage(cause, "Falha de conexão com a API."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const cancelRequest = async (request: ServiceRequest) => {
    if (!canCancelRequest(request.status)) {
      return;
    }

    const confirmed = window.confirm(
      `Deseja cancelar a solicitação "${request.title || "Solicitação"}"?`,
    );
    if (!confirmed) {
      return;
    }

    setIsCancellingId(request.id);
    setError(null);

    try {
      const updated = await serviceRequestsUseCase.cancel(request.id);

      setRequests((current) =>
        current.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)),
      );
    } catch (cause) {
      setError(getServiceRequestsErrorMessage(cause, "Falha de conexão com a API."));
    } finally {
      setIsCancellingId("");
    }
  };

  const submitComment = async () => {
    if (!selectedRequest) {
      return;
    }

    if (!commentText.trim()) {
      setCommentsError("Informe um comentário.");
      return;
    }

    setIsSubmittingComment(true);
    setCommentsError(null);

    try {
      const normalizedCommentFiles = commentFiles
        .map((file) => ({
          fileName: file.fileName.trim(),
          fileKey: file.fileKey.trim(),
          contentType: file.contentType.trim(),
          notes: file.notes.trim(),
        }))
        .filter((file) => file.fileName || file.fileKey);

      if (isEditingComment) {
        await serviceRequestsUseCase.updateComment(
          selectedRequest.id,
          editingCommentId,
          {
            comment: commentText.trim(),
            files: normalizedCommentFiles,
          },
        );
      } else {
        await serviceRequestsUseCase.createComment(selectedRequest.id, {
          parentCommentId: commentParentId || "",
          comment: commentText.trim(),
          files: normalizedCommentFiles,
        });
      }

      setCommentText("");
      setCommentParentId("");
      setCommentFiles([]);
      setEditingCommentId("");
      setIsCommentComposerOpen(false);
      await loadComments(selectedRequest.id);
      await loadData();
    } catch (cause) {
      setCommentsError(
        getServiceRequestsErrorMessage(cause, "Falha de conexão com a API."),
      );
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const openCreateModal = () => {
    setFormError(null);
    setIsCreateModalOpen(true);
  };

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-300">
              <MaterialSymbol
                name="support_agent"
                className="text-[24px] text-amber-700 dark:text-amber-300"
              />
            </div>
            <h1 className="text-2xl font-semibold text-foreground">Solicitações de serviço</h1>
          </div>
          <p className="text-sm text-foreground/70">
            Use este espaço como primeiro contato para explicar sua necessidade.
          </p>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-full border border-default-300 px-2.5 py-1 text-foreground/80">
              Total: {requestMetrics.total}
            </span>
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${getServiceRequestStatusBadgeClassName(
                "aberta",
              )}`}
            >
              Abertas: {requestMetrics.open}
            </span>
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${getServiceRequestStatusBadgeClassName(
                "em_andamento",
              )}`}
            >
              Em andamento: {requestMetrics.inProgress}
            </span>
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${getServiceRequestStatusBadgeClassName(
                "concluida",
              )}`}
            >
              Concluídas: {requestMetrics.concluded}
            </span>
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${getServiceRequestStatusBadgeClassName(
                "cancelada",
              )}`}
            >
              Canceladas: {requestMetrics.cancelled}
            </span>
          </div>
        </div>

        <Button
          color="primary"
          onPress={openCreateModal}
          startContent={
            <MaterialSymbol name="add_comment" className="text-[18px] text-amber-700 dark:text-amber-300" />
          }
        >
          Solicitar
        </Button>
      </header>

      {error ? (
        <Card className="border border-danger/30 bg-danger/10">
          <CardBody>
            <p className="text-sm font-medium text-danger">{error}</p>
          </CardBody>
        </Card>
      ) : null}

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-foreground/70">
          <Spinner size="sm" /> Carregando dados...
        </div>
      ) : (
        <>
          {requests.length === 0 ? (
            <Card className="border border-primary/30 bg-primary/5">
              <CardBody className="space-y-3">
                <h2 className="text-base font-semibold text-foreground">
                  Faça sua primeira solicitação
                </h2>
                <p className="text-sm text-foreground/75">
                  Ainda não encontramos solicitações abertas. Descreva sua necessidade para
                  iniciarmos o atendimento.
                </p>
                <div>
                  <Button
                    color="primary"
                    onPress={openCreateModal}
                    startContent={
                      <MaterialSymbol
                        name="add_comment"
                        className="text-[18px] text-amber-700 dark:text-amber-300"
                      />
                    }
                  >
                    Criar solicitação
                  </Button>
                </div>
              </CardBody>
            </Card>
          ) : null}

          <Card className="border border-default-200">
            <CardBody className="space-y-3">
              <h2 className="text-base font-semibold text-foreground">Solicitações enviadas</h2>

              {requests.length === 0 ? (
                <p className="text-sm text-foreground/70">Nenhuma solicitação enviada.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-default-200 text-left text-foreground/70">
                        <th className="px-2 py-2 font-medium">Título</th>
                        <th className="px-2 py-2 font-medium">Status</th>
                        <th className="px-2 py-2 font-medium">Criada em</th>
                        <th className="px-2 py-2 font-medium">Arquivos</th>
                        <th className="px-2 py-2 font-medium text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requests.map((request, index) => (
                        <tr
                          key={request.id}
                          className={`border-b border-default-100 align-top ${
                            index % 2 === 0
                              ? "bg-default-100/70 dark:bg-default-100/15"
                              : "bg-transparent"
                          }`}
                        >
                          <td className="px-2 py-2">
                            <p className="text-base font-semibold text-foreground">
                              {request.title || "Solicitação"}
                            </p>
                            <p className="text-xs text-foreground/70">{request.description}</p>
                          </td>
                          <td className="px-2 py-2 align-middle">
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-bold ${getServiceRequestStatusBadgeClassName(
                                request.status,
                              )}`}
                            >
                              {formatServiceRequestStatus(request.status)}
                            </span>
                          </td>
                          <td className="px-2 py-2 align-middle">{formatDate(request.created)}</td>
                          <td className="px-2 py-2">
                            {request.files.length === 0 ? (
                              <span className="text-xs text-foreground/60">-</span>
                            ) : (
                              <div className="flex flex-wrap gap-1">
                                {request.files.map((file) => (
                                  <button
                                    type="button"
                                    key={file.id}
                                    onClick={() => openFilePreviewModal(file, { type: "none" })}
                                    className="rounded-full border border-default-300 px-2 py-0.5 text-[11px] text-foreground/70 transition-colors hover:border-primary/60 hover:text-primary"
                                  >
                                    {file.fileName || "arquivo"}
                                  </button>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="px-2 py-2 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                isIconOnly
                                size="sm"
                                variant="flat"
                                className="text-sky-700 dark:text-sky-300"
                                aria-label="Abrir comentários da solicitação"
                                onPress={() => {
                                  void openCommentsModal(request);
                                }}
                              >
                                <MaterialSymbol name="chat" className="text-[17px]" />
                              </Button>
                              <Dropdown placement="bottom-end">
                                <DropdownTrigger>
                                  <Button
                                    isIconOnly
                                    size="sm"
                                    variant="light"
                                    aria-label="Abrir ações da solicitação"
                                    isDisabled={isCancellingId === request.id}
                                  >
                                    {isCancellingId === request.id ? (
                                      <Spinner size="sm" />
                                    ) : (
                                      <MaterialSymbol name="more_vert" className="text-[20px]" />
                                    )}
                                  </Button>
                                </DropdownTrigger>
                                <DropdownMenu
                                  aria-label="Ações da solicitação"
                                  onAction={(key) => {
                                    if (String(key) === "comments") {
                                      void openCommentsModal(request);
                                      return;
                                    }
                                    if (String(key) === "cancel") {
                                      void cancelRequest(request);
                                    }
                                  }}
                                >
                                  <DropdownItem
                                    key="comments"
                                    startContent={
                                      <MaterialSymbol
                                        name="chat"
                                        className="text-[18px]"
                                      />
                                    }
                                  >
                                    Comentários
                                  </DropdownItem>
                                  <DropdownItem
                                    key="cancel"
                                    className="text-danger"
                                    color="danger"
                                    isDisabled={
                                      !canCancelRequest(request.status) ||
                                      isCancellingId === request.id
                                    }
                                    startContent={
                                      <MaterialSymbol
                                        name="cancel"
                                        className="text-[18px] text-danger"
                                      />
                                    }
                                  >
                                    Cancelar
                                  </DropdownItem>
                                </DropdownMenu>
                              </Dropdown>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardBody>
          </Card>
        </>
      )}

      <Modal
        isOpen={isCreateModalOpen}
        onOpenChange={(isOpen) => {
          setIsCreateModalOpen(isOpen);
          if (!isOpen) {
            setFormError(null);
          }
        }}
        placement="center"
        size="3xl"
        scrollBehavior="inside"
        isDismissable={!isSubmitting}
        hideCloseButton={isSubmitting}
      >
        <ModalContent>
          {(closeModal) => (
            <>
              <ModalHeader className="flex items-center gap-2">
                <MaterialSymbol
                  name="add_comment"
                  className="text-[20px] text-amber-700 dark:text-amber-300"
                />
                Solicitar
              </ModalHeader>

              <ModalBody className="space-y-4">
                {formError ? (
                  <div className="rounded-xl border border-danger/30 bg-danger/10 p-3">
                    <p className="text-sm font-medium text-danger">{formError}</p>
                  </div>
                ) : null}

                <Input
                  label="Título (opcional)"
                  value={title}
                  onValueChange={setTitle}
                  placeholder="Ex.: Necessidade inicial do projeto"
                />

                <Textarea
                  label="Descrição"
                  value={description}
                  onValueChange={setDescription}
                  minRows={1}
                  maxRows={8}
                  placeholder="Descreva sua necessidade"
                  isRequired
                />

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">Arquivos</p>
                    <Button
                      type="button"
                      size="sm"
                      variant="flat"
                      onPress={addFile}
                      startContent={
                        <MaterialSymbol
                          name="attach_file"
                          className="text-[16px] text-amber-700 dark:text-amber-300"
                        />
                      }
                    >
                      Adicionar arquivo
                    </Button>
                  </div>

                  {files.length === 0 ? (
                    <p className="text-xs text-foreground/70">
                      Adicione arquivos para complementar sua solicitação.
                    </p>
                  ) : null}

                  {files.map((file, index) => (
                    <div key={`${file.fileName}-${index}`} className="space-y-2 rounded-lg border border-default-200 p-3">
                      <div className="flex items-center gap-2">
                        <FileFormThumbnail file={file} />
                        <span className="text-xs text-foreground/65">Miniatura</span>
                      </div>
                      <p className="text-xs text-foreground/70">
                        <span className="font-semibold">Arquivo:</span>{" "}
                        <button
                          type="button"
                          onClick={() =>
                            openFilePreviewModal(file, {
                              type: "draft-request-file",
                              index,
                            })
                          }
                          className="font-semibold text-primary hover:underline"
                        >
                          {file.fileName || "-"}
                        </button>
                      </p>
                      <div className="flex justify-end">
                        <button
                          type="button"
                          className="text-xs text-danger hover:underline"
                          onClick={() => removeFile(index)}
                        >
                          Remover
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </ModalBody>

              <ModalFooter>
                <Button
                  color="primary"
                  isLoading={isSubmitting}
                  onPress={submitRequest}
                  startContent={
                    isSubmitting ? null : (
                      <MaterialSymbol
                        name="send"
                        className="text-[18px] text-amber-700 dark:text-amber-300"
                      />
                    )
                  }
                >
                  Enviar solicitação
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      <Modal
        isOpen={isCommentsModalOpen}
        onOpenChange={(isOpen) => {
          setIsCommentsModalOpen(isOpen);
          if (!isOpen && !isSubmittingComment) {
            setSelectedRequest(null);
            setComments([]);
            setIsCommentComposerOpen(false);
            setCommentText("");
            setCommentParentId("");
            setCommentFiles([]);
            setEditingCommentId("");
            setIsDeletingCommentId("");
            setHoveredReplyCommentId("");
            setCommentsError(null);
          }
        }}
        placement="center"
        size="4xl"
        scrollBehavior="inside"
        isDismissable={!isSubmittingComment}
        hideCloseButton={isSubmittingComment}
      >
        <ModalContent>
          {(closeModal) => (
            <>
              <ModalHeader className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-2">
                  <MaterialSymbol name="chat" className="text-[20px]" />
                  Comentários da solicitação
                </span>
                {selectedRequest ? (
                  <span className="mr-3 inline-flex items-center gap-1.5 text-xs text-foreground/70">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-bold ${getServiceRequestStatusBadgeClassName(
                        selectedRequest.status,
                      )}`}
                    >
                      {formatServiceRequestStatus(selectedRequest.status)}
                    </span>
                    <span>Criada em: {formatDate(selectedRequest.created)}</span>
                  </span>
                ) : null}
              </ModalHeader>

              <ModalBody className="space-y-4">
                {selectedRequest ? (
                  <div className="space-y-2 rounded-xl border border-default-200 p-3">
                    <p className="text-lg font-bold text-foreground">
                      {selectedRequest.title || "Solicitação"}
                    </p>
                    <div className="rounded-lg bg-default-50/50 px-3 py-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-foreground/60">
                        Descrição
                      </p>
                      <p className="mt-1 max-h-72 overflow-y-auto whitespace-pre-wrap text-sm text-foreground/80">
                        {selectedRequest.description || "-"}
                      </p>
                    </div>
                    {(selectedRequest.files || []).length > 0 ? (
                      <div className="space-y-1.5 rounded-lg bg-default-50/50 px-3 py-2">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-foreground/60">
                          Arquivos da solicitação
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {selectedRequest.files.map((file) => (
                            <button
                              type="button"
                              key={file.id}
                              onClick={() => openFilePreviewModal(file, { type: "none" })}
                              className="rounded-full border border-default-300 px-2 py-0.5 text-[11px] text-foreground/75 transition-colors hover:border-primary/60 hover:text-primary"
                            >
                              {file.fileName || "arquivo"}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {commentsError ? (
                  <div className="rounded-xl border border-danger/30 bg-danger/10 p-3">
                    <p className="text-sm font-medium text-danger">{commentsError}</p>
                  </div>
                ) : null}

                <div className="space-y-2 rounded-xl border border-default-200 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-foreground">
                      Histórico ({comments.length})
                    </p>
                    {selectedRequest?.id ? (
                      <div className="flex items-center gap-2">
                        <Button
                          isIconOnly
                          size="sm"
                          variant="flat"
                          aria-label="Recarregar comentários"
                          title="Recarregar comentários"
                          onPress={() => {
                            void (async () => {
                              await loadComments(selectedRequest.id);
                              await loadData();
                            })();
                          }}
                        >
                          <MaterialSymbol name="refresh" className="text-[16px]" />
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          color="primary"
                          onPress={openNewCommentComposer}
                          startContent={
                            <MaterialSymbol
                              name="add_comment"
                              className="text-[17px] text-amber-700 dark:text-amber-300"
                            />
                          }
                        >
                          Adicionar comentário
                        </Button>
                      </div>
                    ) : null}
                  </div>

                  {isLoadingComments ? (
                    <p className="text-sm text-foreground/70">Carregando comentários...</p>
                  ) : null}

                  {!isLoadingComments && comments.length === 0 ? (
                    <p className="text-sm text-foreground/70">Nenhum comentário ainda.</p>
                  ) : null}

                  {!isLoadingComments && comments.length > 0 ? (
                    <div>
                      {orderedComments.map((comment) => {
                        const replyDepth = getCommentReplyDepth(comment, commentsByID);
                        const canManageOwnComment = canClientDeleteComment(
                          comment,
                          currentClientID,
                        );

                        return (
                          <div
                            key={comment.id}
                            className={`rounded-lg p-[5px] transition-colors duration-150 ${
                              replyDepth > 0 ? "border-l-2 border-primary/25" : ""
                            } ${
                              hoveredReplyCommentId === comment.id
                                ? "bg-default-100/80 dark:bg-default-100/20"
                                : ""
                            }`}
                            style={{
                              marginLeft: `${Math.min(replyDepth, 3) * 20}px`,
                            }}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex justify-start">
                                <div className="flex flex-wrap items-center justify-start gap-x-1.5 gap-y-1 text-[11px] text-foreground/60">
                                  <span className="inline-flex items-center gap-2">
                                    <CommentAuthorAvatar
                                      authorName={comment.authorName}
                                      authorAvatar={comment.authorAvatar}
                                      authorType={comment.authorType}
                                    />
                                    <p
                                      className={`text-xs font-semibold ${
                                        comment.authorType === "client"
                                          ? "text-amber-700 dark:text-amber-300"
                                          : "text-sky-700 dark:text-sky-300"
                                      }`}
                                    >
                                      {comment.authorName || "Usuário"}
                                    </p>
                                  </span>
                                  <span
                                    className="text-[11px] text-foreground/40"
                                    aria-hidden="true"
                                  >
                                    •
                                  </span>
                                  <span>{formatDate(comment.created)}</span>
                                  {comment.files.length > 0 ? (
                                    <>
                                      <span
                                        className="text-[11px] text-foreground/40"
                                        aria-hidden="true"
                                      >
                                        •
                                      </span>
                                      <span>{comment.files.length} anexo(s)</span>
                                    </>
                                  ) : null}
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <Dropdown placement="bottom-end">
                                  <DropdownTrigger>
                                    <Button
                                      isIconOnly
                                      size="sm"
                                      variant="light"
                                      aria-label="Abrir ações do comentário"
                                      isDisabled={isDeletingCommentId === comment.id}
                                      onMouseEnter={() => setHoveredReplyCommentId(comment.id)}
                                      onMouseLeave={() => setHoveredReplyCommentId("")}
                                    >
                                      {isDeletingCommentId === comment.id ? (
                                        <Spinner size="sm" />
                                      ) : (
                                        <MaterialSymbol name="more_vert" className="text-[18px]" />
                                      )}
                                    </Button>
                                  </DropdownTrigger>
                                  <DropdownMenu
                                    aria-label="Ações do comentário"
                                    onAction={(key) => {
                                      const action = String(key);
                                      if (action === "reply") {
                                        openReplyCommentComposer(comment.id);
                                        return;
                                      }
                                      if (action === "edit") {
                                        openEditCommentComposer(comment);
                                        return;
                                      }
                                      if (action === "delete") {
                                        void deleteComment(comment);
                                      }
                                    }}
                                  >
                                    <DropdownItem
                                      key="reply"
                                      startContent={
                                        <MaterialSymbol
                                          name="reply"
                                          className="text-[17px] text-primary"
                                        />
                                      }
                                    >
                                      Responder
                                    </DropdownItem>
                                    {canManageOwnComment ? (
                                      <DropdownItem
                                        key="edit"
                                        startContent={
                                          <MaterialSymbol
                                            name="edit"
                                            className="text-[17px] text-foreground/70"
                                          />
                                        }
                                      >
                                        Editar
                                      </DropdownItem>
                                    ) : null}
                                    {canManageOwnComment ? (
                                      <DropdownItem
                                        key="delete"
                                        className="text-danger"
                                        color="danger"
                                        startContent={
                                          <MaterialSymbol
                                            name="delete"
                                            className="text-[17px] text-danger"
                                          />
                                        }
                                      >
                                        Excluir
                                      </DropdownItem>
                                    ) : null}
                                  </DropdownMenu>
                                </Dropdown>
                              </div>
                            </div>
                            <div
                              className={`mt-1 mb-2 inline-flex max-w-full flex-col rounded-2xl px-3 py-2 ring-1 ${
                                comment.authorType === "client"
                                  ? "bg-success-100/65 text-success-950 ring-success/25 dark:bg-success-900/25 dark:text-success-100 dark:ring-success/30"
                                  : "bg-primary-100/70 text-primary-950 ring-primary/20 dark:bg-primary-900/25 dark:text-primary-100 dark:ring-primary/30"
                              }`}
                            >
                              <p className="whitespace-pre-wrap text-sm leading-6">
                                {comment.comment}
                              </p>

                              {comment.files.length > 0 ? (
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {comment.files.map((file) => (
                                    <button
                                      type="button"
                                      key={file.id}
                                      onClick={() =>
                                        openFilePreviewModal(file, {
                                          type: "comment-file",
                                          requestId:
                                            (comment.serviceRequestId || selectedRequest?.id || "").trim(),
                                          commentId: comment.id,
                                          fileId: file.id,
                                          canDelete: canClientDeleteCommentFile(comment, currentClientID),
                                        })
                                      }
                                      title={file.fileName || "arquivo"}
                                      className="rounded-full border border-default-300/80 bg-background/70 px-2 py-0.5 text-[11px] text-foreground/80 transition-colors hover:border-primary/60 hover:text-primary"
                                    >
                                      {file.fileName || file.fileKey || "arquivo"}
                                    </button>
                                  ))}
                                </div>
                              ) : null}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              </ModalBody>

            </>
          )}
        </ModalContent>
      </Modal>

      <Modal
        isOpen={isCommentComposerOpen}
        onOpenChange={(isOpen) => {
          setIsCommentComposerOpen(isOpen);
          if (!isOpen && !isSubmittingComment) {
            setCommentText("");
            setCommentParentId("");
            setCommentFiles([]);
            setEditingCommentId("");
            setCommentsError(null);
          }
        }}
        placement="center"
        size="3xl"
        scrollBehavior="inside"
        isDismissable={!isSubmittingComment}
        hideCloseButton={isSubmittingComment}
      >
        <ModalContent>
          {(closeModal) => (
            <>
              <ModalHeader className="flex items-center gap-2">
                <MaterialSymbol
                  name={isEditingComment ? "edit" : selectedReplyComment ? "reply" : "add_comment"}
                  className="text-[20px] text-amber-700 dark:text-amber-300"
                />
                {isEditingComment
                  ? "Editar comentário"
                  : selectedReplyComment
                    ? "Responder comentário"
                    : "Novo comentário"}
              </ModalHeader>

              <ModalBody className="space-y-4">
                {isEditingComment && selectedEditingComment ? (
                  <div className="rounded-lg border border-default-300 bg-default-100/60 px-3 py-2">
                    <p className="text-xs text-foreground/80">
                      Editando comentário de{" "}
                      <span className="font-semibold">
                        {selectedEditingComment.authorName || "Usuário"}
                      </span>
                    </p>
                  </div>
                ) : null}

                {selectedReplyComment && !isEditingComment ? (
                  <div className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2">
                    <p className="text-xs text-foreground/80">
                      Respondendo a{" "}
                      <span className="font-semibold">
                        {selectedReplyComment.authorName || "comentário"}
                      </span>
                      : "{truncate(selectedReplyComment.comment, 80)}"
                    </p>
                  </div>
                ) : null}

                {commentsError ? (
                  <div className="rounded-xl border border-danger/30 bg-danger/10 p-3">
                    <p className="text-sm font-medium text-danger">{commentsError}</p>
                  </div>
                ) : null}

                <Textarea
                  label="Descrição"
                  value={commentText}
                  onValueChange={setCommentText}
                  minRows={1}
                  maxRows={6}
                  placeholder="Escreva seu comentário"
                />

                <div className="space-y-2 rounded-xl border border-default-200 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">
                      Arquivos do comentário
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      variant="flat"
                      onPress={addCommentFile}
                      startContent={
                        <MaterialSymbol
                          name="attach_file"
                          className="text-[16px] text-amber-700 dark:text-amber-300"
                        />
                      }
                    >
                      Adicionar arquivo
                    </Button>
                  </div>

                  {commentFiles.length === 0 ? (
                    <p className="text-xs text-foreground/70">Sem anexos no comentário.</p>
                  ) : null}

                  {commentFiles.map((file, index) => (
                    <div
                      key={`${file.fileName}-${index}`}
                      className="space-y-2 rounded-lg border border-default-200 p-3"
                    >
                      <div className="flex items-center gap-2">
                        <FileFormThumbnail file={file} />
                        <span className="text-xs text-foreground/65">Miniatura</span>
                      </div>
                      <p className="text-xs text-foreground/70">
                        <span className="font-semibold">Arquivo:</span>{" "}
                        <button
                          type="button"
                          onClick={() =>
                            openFilePreviewModal(file, {
                              type: "draft-comment-file",
                              index,
                            })
                          }
                          className="font-semibold text-primary hover:underline"
                        >
                          {file.fileName || "-"}
                        </button>
                      </p>
                      <div className="flex justify-end">
                        <button
                          type="button"
                          className="text-xs text-danger hover:underline"
                          onClick={() => removeCommentFile(index)}
                        >
                          Remover
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </ModalBody>

              <ModalFooter>
                <Button
                  color="primary"
                  isLoading={isSubmittingComment}
                  onPress={submitComment}
                  startContent={
                    isSubmittingComment ? null : (
                      <MaterialSymbol
                        name={isEditingComment ? "save" : "send"}
                        className="text-[18px] text-amber-700 dark:text-amber-300"
                      />
                    )
                  }
                >
                  {isEditingComment ? "Salvar edição" : "Enviar comentário"}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      <Modal
        isOpen={isFilePreviewModalOpen}
        onOpenChange={(isOpen) => {
          setIsFilePreviewModalOpen(isOpen);
          if (!isOpen) {
            setFilePreview(null);
            setFilePreviewError(null);
            setIsDeletingPreviewFile(false);
            setImagePreviewZoom(1);
            resetImagePreviewPanState();
          }
        }}
        placement="center"
      >
        <ModalContent className="h-[90vh] max-h-[90vh] w-[90vw] max-w-[90vw]">
          {(closeModal) => (
            <>
              <ModalHeader className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <MaterialSymbol name="visibility" className="text-[20px]" />
                  <div className="min-w-0">
                    <p className="text-base font-semibold text-foreground">
                      Visualizar arquivo
                    </p>
                    <p className="truncate text-xs text-foreground/65">
                      {filePreview?.fileName || "-"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {selectedModalFilePreviewType === "image" ? (
                    <>
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        aria-label="Diminuir zoom da imagem"
                        onPress={zoomOutImagePreview}
                        isDisabled={imagePreviewZoom <= 1}
                      >
                        <MaterialSymbol name="zoom_out" className="text-[16px]" />
                      </Button>
                      <span className="min-w-[58px] text-center text-xs font-semibold text-foreground/80">
                        {Math.round(imagePreviewZoom * 100)}%
                      </span>
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        aria-label="Aumentar zoom da imagem"
                        onPress={zoomInImagePreview}
                        isDisabled={imagePreviewZoom >= 5}
                      >
                        <MaterialSymbol name="zoom_in" className="text-[16px]" />
                      </Button>
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        aria-label="Resetar zoom da imagem"
                        onPress={resetImagePreviewZoom}
                        isDisabled={imagePreviewZoom === 1}
                      >
                        <MaterialSymbol name="restart_alt" className="text-[16px]" />
                      </Button>
                    </>
                  ) : null}
                  {filePreviewOpenUrl ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="flat"
                      startContent={<MaterialSymbol name="open_in_new" className="text-[16px]" />}
                      onPress={() => {
                        window.open(filePreviewOpenUrl, "_blank", "noopener,noreferrer");
                      }}
                    >
                      Abrir
                    </Button>
                  ) : null}
                </div>
              </ModalHeader>

              <ModalBody className="h-full overflow-auto">
                {filePreview ? (
                  <div className="flex h-full flex-col gap-3">
                    {filePreviewError ? (
                      <div className="rounded-xl border border-danger/30 bg-danger/10 p-3">
                        <p className="text-sm font-medium text-danger">{filePreviewError}</p>
                      </div>
                    ) : null}

                    <div className="flex-1 overflow-hidden rounded-xl border border-default-200 bg-default-50/40 dark:bg-default-100/5">
                      {selectedModalFilePreviewType === "image" && filePreviewOpenUrl ? (
                        <div
                          className={`flex h-full w-full items-center justify-center overflow-hidden p-2 ${
                            imagePreviewZoom > 1
                              ? isImagePreviewDragging
                                ? "cursor-grabbing"
                                : "cursor-grab"
                              : "cursor-default"
                          }`}
                          onWheel={onImagePreviewWheel}
                          onMouseDown={onImagePreviewMouseDown}
                          onMouseMove={onImagePreviewMouseMove}
                          onMouseUp={onImagePreviewMouseUp}
                          onMouseLeave={onImagePreviewMouseUp}
                        >
                          <img
                            src={filePreviewOpenUrl}
                            alt={filePreview.fileName}
                            style={{
                              transform: `translate(${imagePreviewPan.x}px, ${imagePreviewPan.y}px) scale(${imagePreviewZoom})`,
                              transformOrigin: "center center",
                            }}
                            className="max-h-full max-w-full select-none object-contain"
                          />
                        </div>
                      ) : selectedModalFilePreviewType === "pdf" && filePreviewOpenUrl ? (
                        <iframe
                          src={filePreviewOpenUrl}
                          title={filePreview.fileName}
                          className="h-full w-full"
                        />
                      ) : (
                        <div className="flex h-full min-h-64 flex-col items-center justify-center px-4 text-center">
                          <MaterialSymbol
                            name="insert_drive_file"
                            className="text-[40px] text-foreground/60"
                          />
                          <p className="mt-2 text-sm font-medium text-foreground/85">
                            Não foi possível exibir a pré-visualização deste arquivo.
                          </p>
                          {filePreview.fileKey && !isDataUrl(filePreview.fileKey) ? (
                            <p className="mt-1 max-w-full truncate text-xs text-foreground/60">
                              Referência: {filePreview.fileKey}
                            </p>
                          ) : null}
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}
              </ModalBody>

              <ModalFooter>
                {canDeletePreviewFile(filePreview?.deleteAction) ? (
                  <Button
                    type="button"
                    color="danger"
                    variant="flat"
                    isLoading={isDeletingPreviewFile}
                    onPress={deletePreviewFile}
                    startContent={
                      isDeletingPreviewFile ? null : (
                        <MaterialSymbol name="delete" className="text-[18px]" />
                      )
                    }
                  >
                    Excluir arquivo
                  </Button>
                ) : null}
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      <Modal
        isOpen={isFilePickerModalOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            closeFilePicker();
          }
        }}
        placement="center"
        size="3xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          {(closeModal) => (
            <>
              <ModalHeader className="flex items-center gap-2">
                <MaterialSymbol name="attach_file" className="text-[20px]" />
                Adicionar arquivo
              </ModalHeader>

              <ModalBody className="space-y-4">
                {filePickerError ? (
                  <div className="rounded-xl border border-danger/30 bg-danger/10 p-3">
                    <p className="text-sm font-medium text-danger">{filePickerError}</p>
                  </div>
                ) : null}

                <div
                  className={`rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors ${
                    isDraggingFile
                      ? "border-primary bg-primary/5"
                      : "border-default-300 bg-default-50/30"
                  }`}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setIsDraggingFile(true);
                  }}
                  onDragLeave={(event) => {
                    event.preventDefault();
                    setIsDraggingFile(false);
                  }}
                  onDrop={onFileDrop}
                >
                  <MaterialSymbol
                    name="upload_file"
                    className="mx-auto text-[36px] text-foreground/65"
                  />
                  <p className="mt-2 text-sm font-medium text-foreground">
                    Solte o arquivo aqui
                  </p>
                  <p className="text-xs text-foreground/65">
                    ou selecione um arquivo do dispositivo
                  </p>
                  <div className="mt-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      onChange={onFileInputChange}
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="flat"
                      onPress={() => fileInputRef.current?.click()}
                      startContent={<MaterialSymbol name="folder_open" className="text-[16px]" />}
                    >
                      Selecionar arquivo
                    </Button>
                  </div>
                </div>

                {selectedLocalFile ? (
                  <div className="space-y-3 rounded-xl border border-default-200 p-3">
                    <p className="text-sm font-semibold text-foreground">Preview</p>

                    {selectedFilePreviewType === "image" ? (
                      <div className="overflow-hidden rounded-lg border border-default-200">
                        <img
                          src={selectedFilePreviewUrl}
                          alt={pendingFile.fileName || "preview do arquivo"}
                          className="max-h-60 w-full object-contain"
                        />
                      </div>
                    ) : selectedFilePreviewType === "pdf" ? (
                      <div className="overflow-hidden rounded-lg border border-default-200">
                        <iframe
                          src={selectedFilePreviewUrl}
                          title="preview do PDF"
                          className="h-60 w-full"
                        />
                      </div>
                    ) : (
                      <div className="rounded-lg border border-default-200 bg-default-50/50 px-3 py-4 text-center">
                        <MaterialSymbol
                          name="description"
                          className="mx-auto text-[28px] text-foreground/65"
                        />
                        <p className="mt-1 text-xs text-foreground/70">
                          Preview indisponível para este tipo de arquivo.
                        </p>
                      </div>
                    )}

                    <div className="space-y-2 rounded-lg border border-default-200 p-3">
                      <p className="text-xs text-foreground/70">
                        <span className="font-semibold">Arquivo:</span>{" "}
                        {pendingFile.fileName || selectedLocalFile.name}
                      </p>
                      <Input
                        label="Observações"
                        value={pendingFile.notes}
                        onValueChange={(value) =>
                          setPendingFile((current) => ({ ...current, notes: value }))
                        }
                      />
                    </div>
                  </div>
                ) : null}
              </ModalBody>

              <ModalFooter>
                <Button
                  variant="light"
                  onPress={() => {
                    closeModal();
                    closeFilePicker();
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  color="primary"
                  onPress={confirmAddPickedFile}
                  startContent={<MaterialSymbol name="check" className="text-[16px]" />}
                >
                  Adicionar arquivo
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </section>
  );
}

function FileFormThumbnail({ file }: { file: FileForm }) {
  const previewType = getFilePreviewType(file.contentType);
  const hasPreview = Boolean(file.previewUrl);

  if (previewType === "image" && hasPreview) {
    return (
      <img
        src={file.previewUrl}
        alt={file.fileName || "miniatura"}
        className="h-10 w-10 rounded-lg border border-default-200 object-cover"
      />
    );
  }

  if (previewType === "pdf") {
    return (
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-danger/30 bg-danger/10">
        <MaterialSymbol name="picture_as_pdf" className="text-[20px] text-danger" />
      </span>
    );
  }

  return (
    <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-default-300 bg-default-100">
      <MaterialSymbol name="description" className="text-[20px] text-foreground/65" />
    </span>
  );
}

async function buildPreviewDataUrl(file: File): Promise<string> {
  const previewType = resolveFilePreviewType(file.type || "", file.name || "", "", "");
  if (previewType === "other") {
    return "";
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(typeof reader.result === "string" ? reader.result : "");
    };
    reader.onerror = () => resolve("");
    reader.readAsDataURL(file);
  });
}

function releaseFilePreview(previewUrl: string) {
  if (!previewUrl || !previewUrl.startsWith("blob:")) {
    return;
  }
  URL.revokeObjectURL(previewUrl);
}

function getFilePreviewType(contentType: string): "image" | "pdf" | "other" {
  const normalized = (contentType || "").trim().toLowerCase();
  if (normalized.startsWith("image/")) {
    return "image";
  }
  if (normalized === "application/pdf" || normalized.includes("pdf")) {
    return "pdf";
  }
  return "other";
}

function resolveFilePreviewType(
  contentType: string,
  fileName: string,
  previewUrl: string,
  fileKey: string,
): "image" | "pdf" | "other" {
  const byContentType = getFilePreviewType(contentType);
  if (byContentType !== "other") {
    return byContentType;
  }

  const normalizedName = (fileName || "").trim().toLowerCase();
  if (/\.(png|jpe?g|gif|webp|bmp|svg)$/.test(normalizedName)) {
    return "image";
  }
  if (normalizedName.endsWith(".pdf")) {
    return "pdf";
  }

  const normalizedSource = `${previewUrl || ""} ${fileKey || ""}`.trim().toLowerCase();
  if (normalizedSource.startsWith("data:application/pdf")) {
    return "pdf";
  }
  if (normalizedSource.startsWith("data:image/")) {
    return "image";
  }
  if (/\.(png|jpe?g|gif|webp|bmp|svg)(\?|#|$)/.test(normalizedSource)) {
    return "image";
  }
  if (/\.pdf(\?|#|$)/.test(normalizedSource)) {
    return "pdf";
  }

  return "other";
}

function resolveFilePreviewUrl(previewUrl: string, fileKey: string): string {
  const normalizedPreviewUrl = (previewUrl || "").trim();
  if (normalizedPreviewUrl) {
    return normalizedPreviewUrl;
  }

  const normalizedFileKey = (fileKey || "").trim();
  if (
    normalizedFileKey.startsWith("data:") ||
    normalizedFileKey.startsWith("blob:") ||
    normalizedFileKey.startsWith("http://") ||
    normalizedFileKey.startsWith("https://")
  ) {
    return normalizedFileKey;
  }

  if (normalizedFileKey.startsWith("/")) {
    return normalizedFileKey;
  }

  if (normalizedFileKey.startsWith("./") || normalizedFileKey.startsWith("../")) {
    return normalizedFileKey;
  }

  if (normalizedFileKey.includes("/") && !normalizedFileKey.includes(" ")) {
    return `/${normalizedFileKey.replace(/^\/+/, "")}`;
  }

  return "";
}

function convertDataUrlToBlobUrl(dataUrl: string): string {
  try {
    const separatorIndex = dataUrl.indexOf(",");
    if (separatorIndex < 0) {
      return dataUrl;
    }

    const header = dataUrl.slice(0, separatorIndex);
    const rawData = dataUrl.slice(separatorIndex + 1);
    const mimeType = header.slice(5).split(";")[0] || "application/octet-stream";
    const isBase64 = header.includes(";base64");

    const byteString = isBase64 ? atob(rawData) : decodeURIComponent(rawData);
    const bytes = new Uint8Array(byteString.length);
    for (let index = 0; index < byteString.length; index += 1) {
      bytes[index] = byteString.charCodeAt(index);
    }

    return URL.createObjectURL(new Blob([bytes], { type: mimeType }));
  } catch {
    return dataUrl;
  }
}

function isDataUrl(value: string): boolean {
  return (value || "").trim().startsWith("data:");
}

function generateFileStorageKey(fileName: string): string {
  const normalizedName = normalizeFileNameForKey(fileName);
  const randomPart =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : normalizedName;

  return normalizedName ? `${randomPart}-${normalizedName}` : randomPart;
}

function normalizeFileNameForKey(fileName: string): string {
  return (fileName || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9._-]/g, "");
}

function canCancelRequest(status: string): boolean {
  const normalizedStatus = normalizeServiceRequestStatus(status);
  return normalizedStatus === "aberta" || normalizedStatus === "em_andamento";
}

function normalizeServiceRequestStatus(status: string): string {
  const normalized = (status || "").trim().toLowerCase();
  if (
    normalized === "aberta" ||
    normalized === "aberto" ||
    normalized === "open"
  ) {
    return "aberta";
  }
  if (
    normalized === "em_andamento" ||
    normalized === "em andamento" ||
    normalized === "em-andamento" ||
    normalized === "andamento" ||
    normalized === "in_progress"
  ) {
    return "em_andamento";
  }
  if (
    normalized === "concluida" ||
    normalized === "concluído" ||
    normalized === "concluido" ||
    normalized === "done" ||
    normalized === "completed"
  ) {
    return "concluida";
  }
  if (
    normalized === "cancelada" ||
    normalized === "cancelado" ||
    normalized === "canceled" ||
    normalized === "cancelled"
  ) {
    return "cancelada";
  }
  return "aberta";
}

function formatServiceRequestStatus(status: string): string {
  const normalizedStatus = normalizeServiceRequestStatus(status);
  if (normalizedStatus === "aberta") {
    return "Aberta";
  }
  if (normalizedStatus === "em_andamento") {
    return "Em andamento";
  }
  if (normalizedStatus === "concluida") {
    return "Concluída";
  }
  if (normalizedStatus === "cancelada") {
    return "Cancelada";
  }
  return "Aberta";
}

function getServiceRequestStatusBadgeClassName(status: string): string {
  const normalizedStatus = normalizeServiceRequestStatus(status);
  if (normalizedStatus === "aberta") {
    return "bg-sky-500/20 text-sky-800 dark:text-sky-200";
  }
  if (normalizedStatus === "em_andamento") {
    return "bg-orange-600/20 text-orange-900 dark:text-orange-300";
  }
  if (normalizedStatus === "concluida") {
    return "bg-emerald-700/20 text-emerald-900 dark:text-emerald-300";
  }
  if (normalizedStatus === "cancelada") {
    return "bg-rose-500/25 text-rose-800 dark:text-rose-200";
  }
  return "border-default-300 bg-default-100 text-foreground/70";
}

function parseDateTime(value: string): number {
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return 0;
  }
  return parsedDate.getTime();
}

function orderCommentsWithReplies(
  comments: ServiceRequestComment[],
): ServiceRequestComment[] {
  if (comments.length <= 1) {
    return comments;
  }

  const commentsByID = new Map<string, ServiceRequestComment>();
  const childrenByParentID = new Map<string, ServiceRequestComment[]>();
  const rootComments: ServiceRequestComment[] = [];

  comments.forEach((comment) => {
    commentsByID.set(comment.id, comment);
  });

  comments.forEach((comment) => {
    const parentID = (comment.parentCommentId || "").trim();
    if (parentID && parentID !== comment.id && commentsByID.has(parentID)) {
      const children = childrenByParentID.get(parentID) || [];
      children.push(comment);
      childrenByParentID.set(parentID, children);
      return;
    }
    rootComments.push(comment);
  });

  rootComments.sort(
    (leftComment, rightComment) =>
      parseDateTime(rightComment.created || "") - parseDateTime(leftComment.created || ""),
  );

  childrenByParentID.forEach((children) => {
    children.sort(
      (leftComment, rightComment) =>
        parseDateTime(leftComment.created || "") - parseDateTime(rightComment.created || ""),
    );
  });

  const orderedComments: ServiceRequestComment[] = [];
  const visitedCommentIDs = new Set<string>();

  const appendComment = (comment: ServiceRequestComment) => {
    if (visitedCommentIDs.has(comment.id)) {
      return;
    }

    visitedCommentIDs.add(comment.id);
    orderedComments.push(comment);

    const children = childrenByParentID.get(comment.id) || [];
    children.forEach((childComment) => {
      appendComment(childComment);
    });
  };

  rootComments.forEach((rootComment) => {
    appendComment(rootComment);
  });

  if (visitedCommentIDs.size < comments.length) {
    const remainingComments = comments
      .filter((comment) => !visitedCommentIDs.has(comment.id))
      .sort(
        (leftComment, rightComment) =>
          parseDateTime(rightComment.created || "") - parseDateTime(leftComment.created || ""),
      );

    remainingComments.forEach((remainingComment) => {
      appendComment(remainingComment);
    });
  }

  return orderedComments;
}

function getCommentReplyDepth(
  comment: ServiceRequestComment,
  commentsByID: Map<string, ServiceRequestComment>,
): number {
  let depth = 0;
  let parentID = (comment.parentCommentId || "").trim();
  const visited = new Set<string>();

  while (parentID && !visited.has(parentID)) {
    visited.add(parentID);
    const parentComment = commentsByID.get(parentID);
    if (!parentComment) {
      break;
    }
    depth += 1;
    parentID = (parentComment.parentCommentId || "").trim();
  }

  return depth;
}

function getServiceRequestsErrorMessage(cause: unknown, fallback: string): string {
  if (
    cause instanceof ServiceRequestsApiError ||
    cause instanceof ServiceRequestsValidationError ||
    cause instanceof ServiceRequestsUnexpectedError
  ) {
    return cause.message;
  }

  return fallback;
}

function canDeletePreviewFile(action?: FilePreviewDeleteAction): boolean {
  if (!action || action.type === "none") {
    return false;
  }

  if (action.type === "comment-file") {
    return action.canDelete;
  }

  return true;
}

function canClientDeleteComment(
  comment: ServiceRequestComment,
  currentClientID: string,
): boolean {
  const normalizedCommentClientID = (comment.clientId || "").trim();
  if (normalizedCommentClientID && currentClientID) {
    return normalizedCommentClientID === currentClientID;
  }

  return (comment.authorType || "").trim().toLowerCase() === "client";
}

function canClientDeleteCommentFile(
  comment: ServiceRequestComment,
  currentClientID: string,
): boolean {
  return canClientDeleteComment(comment, currentClientID);
}

function isClientAuthor(authorType?: string): boolean {
  return (authorType || "").trim().toLowerCase() === "client";
}

function getCommentAuthorInitial(authorName?: string): string {
  const normalizedName = (authorName || "").trim();
  if (!normalizedName) {
    return "?";
  }

  const firstWord = normalizedName.split(/\s+/)[0] || normalizedName;
  return (firstWord.charAt(0) || "?").toUpperCase();
}

function CommentAuthorAvatar({
  authorName,
  authorAvatar,
  authorType,
}: {
  authorName?: string;
  authorAvatar?: string;
  authorType?: string;
}) {
  const isClient = isClientAuthor(authorType);
  const normalizedAvatar = (authorAvatar || "").trim();

  return (
    <span
      className={`inline-flex h-7 w-7 items-center justify-center overflow-hidden rounded-full text-[10px] font-bold ${
        isClient
          ? "bg-amber-100 text-amber-800 ring-1 ring-amber-300 dark:bg-amber-500/20 dark:text-amber-200 dark:ring-amber-400/40"
          : "bg-sky-100 text-sky-800 ring-1 ring-sky-300 dark:bg-sky-500/20 dark:text-sky-200 dark:ring-sky-400/40"
      }`}
      title={authorName || "Usuário"}
      aria-hidden="true"
    >
      {normalizedAvatar ? (
        <img
          src={normalizedAvatar}
          alt={authorName || "Avatar"}
          className="h-full w-full object-cover"
        />
      ) : (
        getCommentAuthorInitial(authorName)
      )}
    </span>
  );
}

function formatDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }

  return parsed.toLocaleString("pt-BR");
}

function truncate(value: string, maxLength: number): string {
  if (!value) {
    return "";
  }

  const normalized = value.trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, Math.max(0, maxLength - 1))}…`;
}
