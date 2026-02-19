"use client";

import { Button } from "@heroui/button";
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
import {
  ChangeEvent,
  DragEvent,
  FormEvent,
  MouseEvent as ReactMouseEvent,
  WheelEvent as ReactWheelEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { MaterialSymbol } from "@/components/material-symbol";
import { createServiceRequestsUseCase } from "@/modules/service-requests/composition/create-service-requests-use-case";
import type {
  ServiceRequest as AdminServiceRequest,
  ServiceRequestComment,
} from "@/modules/service-requests/domain/entities/service-request";
import {
  ServiceRequestsApiError,
  ServiceRequestsMissingSessionError,
  ServiceRequestsValidationError,
} from "@/modules/service-requests/domain/errors/service-requests-errors";


interface CommentFileForm {
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

interface CommentFormData {
  parentCommentId: string;
  comment: string;
  files: CommentFileForm[];
}

type FilePreviewDeleteAction =
  | { type: "none" }
  | { type: "draft-comment-file"; index: number }
  | {
      type: "comment-file";
      requestId: string;
      commentId: string;
      fileId: string;
      canDelete: boolean;
    };

function createEmptyCommentFile(): CommentFileForm {
  return {
    fileName: "",
    fileKey: "",
    contentType: "",
    notes: "",
    previewUrl: "",
  };
}

function createEmptyCommentForm(): CommentFormData {
  return {
    parentCommentId: "",
    comment: "",
    files: [],
  };
}

export default function SolicitacoesPage() {
  const [requests, setRequests] = useState<AdminServiceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdatingStatusID, setIsUpdatingStatusID] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCommentComposerModalOpen, setIsCommentComposerModalOpen] =
    useState(false);
  const [isCommentFilePickerModalOpen, setIsCommentFilePickerModalOpen] =
    useState(false);
  const [isFilePreviewModalOpen, setIsFilePreviewModalOpen] = useState(false);
  const [isDeletingPreviewFile, setIsDeletingPreviewFile] = useState(false);
  const [isDeletingCommentID, setIsDeletingCommentID] = useState("");
  const [editingCommentID, setEditingCommentID] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<AdminServiceRequest | null>(
    null,
  );
  const [comments, setComments] = useState<ServiceRequestComment[]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [hoveredReplyCommentID, setHoveredReplyCommentID] = useState("");

  const [commentForm, setCommentForm] = useState<CommentFormData>(
    createEmptyCommentForm(),
  );
  const [commentError, setCommentError] = useState<string | null>(null);
  const [filePreviewError, setFilePreviewError] = useState<string | null>(null);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isDraggingCommentFile, setIsDraggingCommentFile] = useState(false);
  const [commentFilePickerError, setCommentFilePickerError] = useState<
    string | null
  >(null);
  const [pendingCommentFile, setPendingCommentFile] =
    useState<CommentFileForm>(createEmptyCommentFile());
  const [selectedLocalCommentFile, setSelectedLocalCommentFile] =
    useState<File | null>(null);
  const [selectedCommentFilePreviewUrl, setSelectedCommentFilePreviewUrl] =
    useState("");
  const [filePreview, setFilePreview] = useState<FilePreviewState | null>(null);
  const [imagePreviewZoom, setImagePreviewZoom] = useState(1);
  const [imagePreviewPan, setImagePreviewPan] = useState({ x: 0, y: 0 });
  const [isImagePreviewDragging, setIsImagePreviewDragging] = useState(false);
  const adminUserID = useMemo(() => readAdminUserIDFromCookie(), []);
  const serviceRequestsUseCase = useMemo(() => createServiceRequestsUseCase(), []);

  const commentFileInputRef = useRef<HTMLInputElement>(null);
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

  useEffect(() => {
    void loadRequests();
  }, []);

  useEffect(() => {
    return () => {
      releaseFilePreview(selectedCommentFilePreviewUrl);
    };
  }, [selectedCommentFilePreviewUrl]);
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

  const orderedRequests = useMemo(() => {
    return [...requests].sort((firstRequest, secondRequest) => {
      const firstWeight = statusSortWeight(firstRequest.status);
      const secondWeight = statusSortWeight(secondRequest.status);
      if (firstWeight !== secondWeight) {
        return firstWeight - secondWeight;
      }

      const firstDate = parseDateTime(
        firstRequest.updated || firstRequest.created || "",
      );
      const secondDate = parseDateTime(
        secondRequest.updated || secondRequest.created || "",
      );
      return secondDate - firstDate;
    });
  }, [requests]);

  const metrics = useMemo(() => {
    const result = {
      total: requests.length,
      open: 0,
      inProgress: 0,
      concluded: 0,
      cancelled: 0,
    };

    requests.forEach((request) => {
      const normalizedStatus = normalizeStatus(request.status);
      if (normalizedStatus === "aberta") {
        result.open += 1;
        return;
      }
      if (normalizedStatus === "em_andamento") {
        result.inProgress += 1;
        return;
      }
      if (normalizedStatus === "concluida") {
        result.concluded += 1;
        return;
      }
      if (normalizedStatus === "cancelada") {
        result.cancelled += 1;
      }
    });

    return result;
  }, [requests]);

  const selectedParentComment = useMemo(() => {
    if (!commentForm.parentCommentId) {
      return null;
    }

    return (
      comments.find((comment) => comment.id === commentForm.parentCommentId) || null
    );
  }, [comments, commentForm.parentCommentId]);
  const selectedEditingComment = useMemo(() => {
    if (!editingCommentID) {
      return null;
    }

    return comments.find((comment) => comment.id === editingCommentID) || null;
  }, [comments, editingCommentID]);
  const isEditingComment = editingCommentID.trim() !== "";

  const commentsByID = useMemo(() => {
    const commentMap = new Map<string, ServiceRequestComment>();
    comments.forEach((comment) => {
      commentMap.set(comment.id, comment);
    });
    return commentMap;
  }, [comments]);

  const orderedComments = useMemo(() => {
    return orderCommentsWithReplies(comments);
  }, [comments]);

  const selectedCommentFilePreviewType = useMemo(
    () =>
      resolveFilePreviewType(
        pendingCommentFile.contentType,
        pendingCommentFile.fileName,
        pendingCommentFile.previewUrl,
        pendingCommentFile.fileKey,
      ),
    [
      pendingCommentFile.contentType,
      pendingCommentFile.fileName,
      pendingCommentFile.previewUrl,
      pendingCommentFile.fileKey,
    ],
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

  const filePreviewTypeLabel = useMemo(() => {
    if (selectedModalFilePreviewType === "image") {
      return "Imagem";
    }
    if (selectedModalFilePreviewType === "pdf") {
      return "PDF";
    }
    return "Arquivo";
  }, [selectedModalFilePreviewType]);

  const loadRequests = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const payload = await serviceRequestsUseCase.list();
      setRequests(Array.isArray(payload) ? payload : []);
      setError(null);
    } catch (cause) {
      setError(getServiceRequestsErrorMessage(cause, "Falha de conexão com a API."));
    } finally {
      setIsLoading(false);
    }
  };

  const loadRequestDetails = async (requestID: string, showLoader = true) => {
    if (showLoader) {
      setIsLoadingDetails(true);
    }
    setDetailsError(null);

    try {
      const details = await serviceRequestsUseCase.getDetails(requestID);
      const normalizedRequest = details.request;
      const normalizedComments = Array.isArray(details.comments) ? details.comments : [];

      setSelectedRequest(normalizedRequest);
      setComments(normalizedComments);
      setRequests((currentRequests) =>
        mergeServiceRequest(currentRequests, normalizedRequest),
      );
      return true;
    } catch (cause) {
      setDetailsError(
        getServiceRequestsErrorMessage(cause, "Falha de conexão com a API."),
      );
      return false;
    } finally {
      if (showLoader) {
        setIsLoadingDetails(false);
      }
    }
  };

  const openRequest = (request: AdminServiceRequest) => {
    setSelectedRequest(request);
    setComments([]);
    setCommentForm(createEmptyCommentForm());
    setEditingCommentID("");
    setIsCommentComposerModalOpen(false);
    setCommentError(null);
    setDetailsError(null);
    setIsModalOpen(true);
    void loadRequestDetails(request.id, true);
  };

  const updateRequestStatus = async (
    request: AdminServiceRequest,
    nextStatus: "concluida" | "cancelada",
  ) => {
    if (!canChangeRequestStatus(request.status)) {
      return;
    }

    setIsUpdatingStatusID(request.id);
    setError(null);

    try {
      const payload = await serviceRequestsUseCase.updateStatus(
        request.id,
        nextStatus,
      );

      setRequests((currentRequests) => mergeServiceRequest(currentRequests, payload));
      setSelectedRequest((currentRequest) =>
        currentRequest?.id === payload.id ? payload : currentRequest,
      );
    } catch (cause) {
      setError(getServiceRequestsErrorMessage(cause, "Falha de conexão com a API."));
    } finally {
      setIsUpdatingStatusID("");
    }
  };

  const handleRequestMenuAction = async (
    request: AdminServiceRequest,
    action: string | number,
  ) => {
    const selectedAction = String(action);
    if (selectedAction === "open" || selectedAction === "comments") {
      openRequest(request);
      return;
    }

    if (selectedAction === "conclude") {
      await updateRequestStatus(request, "concluida");
      return;
    }

    if (selectedAction === "cancel") {
      await updateRequestStatus(request, "cancelada");
    }
  };

  const openCommentFilePicker = () => {
    releaseFilePreview(selectedCommentFilePreviewUrl);
    setSelectedCommentFilePreviewUrl("");
    setSelectedLocalCommentFile(null);
    setPendingCommentFile(createEmptyCommentFile());
    setCommentFilePickerError(null);
    setIsDraggingCommentFile(false);
    setIsCommentFilePickerModalOpen(true);
  };

  const closeCommentFilePicker = () => {
    releaseFilePreview(selectedCommentFilePreviewUrl);
    setSelectedCommentFilePreviewUrl("");
    setSelectedLocalCommentFile(null);
    setPendingCommentFile(createEmptyCommentFile());
    setCommentFilePickerError(null);
    setIsDraggingCommentFile(false);
    setIsCommentFilePickerModalOpen(false);
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

  const onCommentFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (!file) {
      return;
    }
    void loadSelectedCommentFile(file);
    event.target.value = "";
  };

  const onCommentFileDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingCommentFile(false);
    const file = event.dataTransfer.files?.[0] || null;
    if (!file) {
      return;
    }
    void loadSelectedCommentFile(file);
  };

  const loadSelectedCommentFile = async (file: File) => {
    const normalizedName = normalizeFileNameForKey(file.name);
    const generatedKey = generateFileStorageKey(normalizedName);
    const previewUrl = await buildPreviewDataUrl(file);

    releaseFilePreview(selectedCommentFilePreviewUrl);
    setSelectedLocalCommentFile(file);
    setPendingCommentFile({
      fileName: file.name,
      fileKey: generatedKey,
      contentType: file.type || "",
      notes: "",
      previewUrl,
    });
    setSelectedCommentFilePreviewUrl(previewUrl);
    setCommentFilePickerError(null);
  };

  const confirmAddPickedCommentFile = () => {
    const normalizedFileName = pendingCommentFile.fileName.trim();
    if (!normalizedFileName) {
      setCommentFilePickerError("Selecione um arquivo para adicionar.");
      return;
    }

    const normalizedPreviewUrl = (
      pendingCommentFile.previewUrl || selectedCommentFilePreviewUrl
    ).trim();
    const normalizedFileKey =
      normalizedPreviewUrl ||
      pendingCommentFile.fileKey.trim() ||
      generateFileStorageKey(normalizeFileNameForKey(normalizedFileName));

    const normalizedFile: CommentFileForm = {
      fileName: normalizedFileName,
      fileKey: normalizedFileKey,
      contentType: pendingCommentFile.contentType.trim(),
      notes: pendingCommentFile.notes.trim(),
      previewUrl:
        pendingCommentFile.previewUrl || selectedCommentFilePreviewUrl || "",
    };

    setCommentForm((currentForm) => ({
      ...currentForm,
      files: [...currentForm.files, normalizedFile],
    }));
    closeCommentFilePicker();
  };

  const handleRemoveCommentFile = (index: number) => {
    setCommentForm((currentForm) => ({
      ...currentForm,
      files: currentForm.files.filter((_, currentIndex) => currentIndex !== index),
    }));
  };

  const setReplyParent = (parentCommentID: string) => {
    setEditingCommentID("");
    setCommentForm((currentForm) => ({
      ...currentForm,
      parentCommentId: parentCommentID,
    }));
  };

  const clearReplyParent = () => {
    setCommentForm((currentForm) => ({
      ...currentForm,
      parentCommentId: "",
    }));
  };

  const openNewCommentComposer = () => {
    setEditingCommentID("");
    setCommentForm(createEmptyCommentForm());
    setCommentError(null);
    setIsCommentComposerModalOpen(true);
  };

  const openReplyCommentComposer = (parentCommentID: string) => {
    setReplyParent(parentCommentID);
    setCommentForm((currentForm) => ({
      ...currentForm,
      comment: "",
      files: [],
    }));
    setCommentError(null);
    setIsCommentComposerModalOpen(true);
  };

  const openEditComment = (comment: ServiceRequestComment) => {
    if (!canAdminDeleteComment(comment, adminUserID)) {
      setCommentError("Você só pode editar comentários criados por você.");
      return;
    }

    setEditingCommentID(comment.id);
    setCommentError(null);
    setCommentForm({
      parentCommentId: comment.parentCommentId || "",
      comment: comment.comment || "",
      files: [],
    });
    setIsCommentComposerModalOpen(true);
  };

  const deleteComment = async (comment: ServiceRequestComment) => {
    const requestID = (comment.serviceRequestId || selectedRequest?.id || "").trim();
    if (!requestID) {
      setCommentError("Não foi possível identificar a solicitação.");
      return;
    }

    if (!canAdminDeleteComment(comment, adminUserID)) {
      setCommentError("Você só pode excluir comentários criados por você.");
      return;
    }

    setIsDeletingCommentID(comment.id);
    setCommentError(null);

    try {
      await serviceRequestsUseCase.deleteComment(requestID, comment.id);

      if (commentForm.parentCommentId === comment.id) {
        clearReplyParent();
      }
      if (editingCommentID === comment.id) {
        setEditingCommentID("");
        setCommentForm(createEmptyCommentForm());
        setIsCommentComposerModalOpen(false);
      }

      await loadRequestDetails(requestID, false);
    } catch {
      setCommentError("Falha de conexão com a API.");
    } finally {
      setIsDeletingCommentID("");
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
      setFilePreviewError("Você só pode excluir anexos dos comentários da equipe.");
      return;
    }

    setIsDeletingPreviewFile(true);
    setFilePreviewError(null);

    try {
      if (action.type === "draft-comment-file") {
        handleRemoveCommentFile(action.index);
        setIsFilePreviewModalOpen(false);
        setFilePreview(null);
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
    } catch {
      setFilePreviewError("Falha de conexão com a API.");
    } finally {
      setIsDeletingPreviewFile(false);
    }
  };

  const submitComment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedRequest?.id) {
      setCommentError("Selecione uma solicitação.");
      return;
    }

    const normalizedComment = commentForm.comment.trim();
    if (!normalizedComment) {
      setCommentError("Comentário é obrigatório.");
      return;
    }

    setIsSubmittingComment(true);
    setCommentError(null);

    try {
      const normalizedFiles = commentForm.files
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
          editingCommentID,
          {
            comment: normalizedComment,
            files: normalizedFiles,
          },
        );
      } else {
        await serviceRequestsUseCase.createComment(selectedRequest.id, {
          parentCommentId: commentForm.parentCommentId || "",
          comment: normalizedComment,
          files: normalizedFiles,
        });
      }

      setEditingCommentID("");
      setCommentForm(createEmptyCommentForm());
      setIsCommentComposerModalOpen(false);
      await loadRequestDetails(selectedRequest.id, false);
    } catch (cause) {
      setCommentError(
        getServiceRequestsErrorMessage(cause, "Falha de conexão com a API."),
      );
    } finally {
      setIsSubmittingComment(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-default-200 bg-content1/70 p-6 backdrop-blur-md">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-foreground/60">
              <MaterialSymbol name="support_agent" className="text-[16px]" />
              Atendimento
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-foreground">
              Solicitações
            </h1>
            <p className="mt-2 text-sm text-foreground/80">
              Acompanhe as últimas solicitações e trate rapidamente as que ainda
              estão abertas.
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full border border-default-300 px-2.5 py-1 text-foreground/80">
                Total: {metrics.total}
              </span>
              <span className="rounded-full border border-blue-500/40 bg-blue-500/10 px-2.5 py-1 text-blue-700 dark:text-blue-300">
                Abertas: {metrics.open}
              </span>
              <span className="rounded-full border border-orange-700/50 bg-orange-700/15 px-2.5 py-1 text-orange-800 dark:text-orange-300">
                Em andamento: {metrics.inProgress}
              </span>
              <span className="rounded-full border border-emerald-700/50 bg-emerald-700/15 px-2.5 py-1 text-emerald-800 dark:text-emerald-300">
                Concluídas: {metrics.concluded}
              </span>
              <span className="rounded-full border border-danger/40 bg-danger/10 px-2.5 py-1 text-danger">
                Canceladas: {metrics.cancelled}
              </span>
            </div>
          </div>

          <Button
            color="primary"
            variant="flat"
            startContent={<MaterialSymbol name="refresh" className="text-[18px]" />}
            onPress={() => {
              void loadRequests();
            }}
            isLoading={isLoading}
          >
            Atualizar
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-default-200 bg-content1/70 backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-content1/70">
              <tr className="border-b border-default-200">
                <th className="px-4 py-3 font-semibold text-foreground/80">Cliente</th>
                <th className="px-4 py-3 font-semibold text-foreground/80">Solicitação</th>
                <th className="px-4 py-3 font-semibold text-foreground/80">Projeto</th>
                <th className="px-4 py-3 font-semibold text-foreground/80">Status</th>
                <th className="px-4 py-3 font-semibold text-foreground/80">Comentários</th>
                <th className="px-4 py-3 font-semibold text-foreground/80">Criada em</th>
                <th className="px-4 py-3 text-right font-semibold text-foreground/80">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td className="px-4 py-6 text-foreground/70" colSpan={7}>
                    Carregando solicitações...
                  </td>
                </tr>
              ) : null}

              {!isLoading && error ? (
                <tr>
                  <td className="px-4 py-6 text-danger" colSpan={7}>
                    {error}
                  </td>
                </tr>
              ) : null}

              {!isLoading && !error && orderedRequests.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-foreground/70" colSpan={7}>
                    Nenhuma solicitação encontrada.
                  </td>
                </tr>
              ) : null}

              {!isLoading && !error
                ? orderedRequests.map((request) => {
                    const isStatusClosed = !canChangeRequestStatus(request.status);
                    return (
                      <tr
                        key={request.id}
                        className="border-b border-default-200/70 last:border-b-0"
                      >
                        <td className="px-4 py-3 text-foreground/90">
                          <p className="font-medium text-foreground">
                            {request.clientName || "-"}
                          </p>
                          <p className="text-xs text-foreground/70">
                            {request.clientEmail || request.clientLogin || "-"}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-foreground/90">
                          <p className="text-base font-semibold text-foreground">
                            {request.title || "Solicitação"}
                          </p>
                          <p className="max-w-[360px] truncate text-xs text-foreground/70">
                            {request.description || "-"}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-foreground/80">
                          {request.projectName || "-"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-bold ${getStatusBadgeClass(
                              request.status,
                            )}`}
                          >
                            {formatStatusLabel(request.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-foreground/80">
                          <p className="text-xs text-foreground/60">
                            Total: {request.comments || 0}
                          </p>
                          <p className="text-xs text-foreground/60">
                            Cliente: {request.openComments || 0}
                          </p>
                          <p className="text-xs text-foreground/60">
                            Equipe:{" "}
                            {Math.max((request.comments || 0) - (request.openComments || 0), 0)}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-foreground/80">
                          {formatDateTime(request.created)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="flat"
                              startContent={
                                <MaterialSymbol name="chat" className="text-[16px]" />
                              }
                              onPress={() => openRequest(request)}
                            >
                              Comentários
                            </Button>

                            <Dropdown placement="bottom-end">
                              <DropdownTrigger>
                                <Button
                                  isIconOnly
                                  size="sm"
                                  variant="light"
                                  aria-label={`Abrir ações da solicitação ${request.title}`}
                                  isDisabled={isUpdatingStatusID === request.id}
                                >
                                  <MaterialSymbol name="more_vert" className="text-[20px]" />
                                </Button>
                              </DropdownTrigger>
                              <DropdownMenu
                                aria-label={`Ações da solicitação ${request.title}`}
                                onAction={(key) => {
                                  void handleRequestMenuAction(request, key);
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
                                  key="open"
                                  startContent={
                                    <MaterialSymbol
                                      name="visibility"
                                      className="text-[18px]"
                                    />
                                  }
                                >
                                  Abrir
                                </DropdownItem>
                                <DropdownItem
                                  key="conclude"
                                  isDisabled={isStatusClosed || isUpdatingStatusID === request.id}
                                  className="text-success"
                                  color="success"
                                  startContent={
                                    <MaterialSymbol
                                      name="task_alt"
                                      className="text-[18px] text-success"
                                    />
                                  }
                                >
                                  Concluir
                                </DropdownItem>
                                <DropdownItem
                                  key="cancel"
                                  isDisabled={isStatusClosed || isUpdatingStatusID === request.id}
                                  className="text-danger"
                                  color="danger"
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
                    );
                  })
                : null}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onOpenChange={(open) => {
          setIsModalOpen(open);
          if (!open) {
            setSelectedRequest(null);
            setComments([]);
            setHoveredReplyCommentID("");
            setDetailsError(null);
            setCommentError(null);
            setCommentForm(createEmptyCommentForm());
            setIsDeletingCommentID("");
            setEditingCommentID("");
            setIsCommentComposerModalOpen(false);
            closeCommentFilePicker();
            setIsFilePreviewModalOpen(false);
            setFilePreview(null);
            setFilePreviewError(null);
            setIsDeletingPreviewFile(false);
          }
        }}
        size="5xl"
        placement="center"
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
                      className={`rounded-full px-2.5 py-1 text-xs font-bold ${getStatusBadgeClass(
                        selectedRequest.status,
                      )}`}
                    >
                      {formatStatusLabel(selectedRequest.status)}
                    </span>
                    <span>Criada em: {formatDateTime(selectedRequest.created)}</span>
                  </span>
                ) : null}
              </ModalHeader>

              <ModalBody className="space-y-5">
                {detailsError ? (
                  <div className="rounded-xl border border-danger/30 bg-danger/10 p-3">
                    <p className="text-sm font-medium text-danger">{detailsError}</p>
                  </div>
                ) : null}

                {isLoadingDetails ? (
                  <p className="text-sm text-foreground/70">
                    Carregando detalhes da solicitação...
                  </p>
                ) : null}

                {!isLoadingDetails && selectedRequest ? (
                  <>
                    <div className="space-y-2 rounded-xl border border-default-200 p-3">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-foreground/75">
                        <span className="font-medium text-foreground">
                          {selectedRequest.clientName || "-"}
                        </span>
                        <span aria-hidden="true">•</span>
                        <span>{selectedRequest.clientEmail || selectedRequest.clientLogin || "-"}</span>
                      </div>
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

                    <div className="space-y-3 rounded-xl border border-default-200 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-foreground">
                          Comentários ({comments.length})
                        </p>
                        {selectedRequest.id ? (
                          <div className="flex items-center gap-2">
                            <Button
                              isIconOnly
                              size="sm"
                              variant="flat"
                              aria-label="Recarregar comentários"
                              title="Recarregar comentários"
                              onPress={() => {
                                void loadRequestDetails(selectedRequest.id, true);
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

                      {comments.length === 0 ? (
                        <p className="text-sm text-foreground/70">
                          Nenhum comentário ainda.
                        </p>
                      ) : (
                        <div>
                          {orderedComments.map((comment) => {
                            const replyDepth = getCommentReplyDepth(comment, commentsByID);
                            const canManageOwnComment = canAdminDeleteComment(
                              comment,
                              adminUserID,
                            );

                            return (
                              <div
                                key={comment.id}
                                className={`rounded-lg p-[5px] transition-colors duration-150 ${
                                  replyDepth > 0 ? "border-l-2 border-primary/25" : ""
                                } ${
                                  hoveredReplyCommentID === comment.id
                                    ? "bg-default-100/80 dark:bg-default-100/20"
                                    : ""
                                }`}
                                style={{
                                  marginLeft: `${Math.min(replyDepth, 3) * 20}px`,
                                }}
                              >
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                  <div className="min-w-0 flex-1">
                                    <div className="flex justify-start">
                                      <div className="flex flex-wrap items-center justify-start gap-x-1.5 gap-y-1 text-[11px] text-foreground/60">
                                        <span className="inline-flex items-center gap-2">
                                          <CommentAuthorAvatar
                                            authorName={comment.authorName}
                                            authorAvatar={comment.authorAvatar}
                                            authorType={comment.authorType}
                                          />
                                          <span
                                            className={`text-xs font-semibold ${
                                              comment.authorType === "client"
                                                ? "text-amber-700 dark:text-amber-300"
                                                : "text-sky-700 dark:text-sky-300"
                                            }`}
                                          >
                                            {comment.authorName || "Usuário"}
                                          </span>
                                        </span>
                                        <span
                                          className="text-[11px] text-foreground/40"
                                          aria-hidden="true"
                                        >
                                          •
                                        </span>
                                        <span>{formatDateTime(comment.created)}</span>
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
                                  </div>

                                  <div className="flex items-center gap-1">
                                    <Dropdown placement="bottom-end">
                                      <DropdownTrigger>
                                        <Button
                                          isIconOnly
                                          size="sm"
                                          variant="light"
                                          aria-label="Abrir ações do comentário"
                                          isDisabled={isDeletingCommentID === comment.id}
                                          onMouseEnter={() => setHoveredReplyCommentID(comment.id)}
                                          onMouseLeave={() => setHoveredReplyCommentID("")}
                                        >
                                          <MaterialSymbol
                                            name="more_vert"
                                            className="text-[18px]"
                                          />
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
                                            openEditComment(comment);
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
                                          className="rounded-full border border-default-300/80 bg-background/70 px-2 py-0.5 text-[11px] text-foreground/80 transition-colors hover:border-primary/60 hover:text-primary"
                                          title={file.fileName || "arquivo"}
                                          onClick={() =>
                                            openFilePreviewModal(file, {
                                              type: "comment-file",
                                              requestId:
                                                (comment.serviceRequestId || selectedRequest?.id || "").trim(),
                                              commentId: comment.id,
                                              fileId: file.id,
                                              canDelete:
                                                canAdminDeleteCommentFile(comment, adminUserID),
                                            })
                                          }
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
                      )}
                    </div>

                  </>
                ) : null}
              </ModalBody>

            </>
          )}
        </ModalContent>
      </Modal>

      <Modal
        isOpen={isCommentComposerModalOpen}
        onOpenChange={(open) => {
          setIsCommentComposerModalOpen(open);
          if (!open && !isSubmittingComment) {
            setEditingCommentID("");
            setCommentForm(createEmptyCommentForm());
            setCommentError(null);
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
            <form className="space-y-3" onSubmit={submitComment}>
              <ModalHeader className="flex items-center gap-2">
                <MaterialSymbol
                  name={isEditingComment ? "edit" : selectedParentComment ? "reply" : "add_comment"}
                  className="text-[20px] text-amber-700 dark:text-amber-300"
                />
                {isEditingComment
                  ? "Editar comentário"
                  : selectedParentComment
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

                {selectedParentComment && !isEditingComment ? (
                  <div className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2">
                    <p className="text-xs text-foreground/80">
                      Respondendo a{" "}
                      <span className="font-semibold">
                        {selectedParentComment.authorName || "comentário"}
                      </span>
                      : "{selectedParentComment.comment.slice(0, 80)}"
                    </p>
                  </div>
                ) : null}

                {commentError ? (
                  <div className="rounded-xl border border-danger/30 bg-danger/10 p-3">
                    <p className="text-sm font-medium text-danger">{commentError}</p>
                  </div>
                ) : null}

                <Textarea
                  label="Descrição"
                  value={commentForm.comment}
                  onValueChange={(value) =>
                    setCommentForm((currentForm) => ({
                      ...currentForm,
                      comment: value,
                    }))
                  }
                  minRows={1}
                  maxRows={6}
                  placeholder="Escreva seu comentário"
                  isRequired
                />

                <div className="space-y-2 rounded-xl border border-default-200 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-foreground">
                      Arquivos do comentário
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      variant="flat"
                      startContent={
                        <MaterialSymbol
                          name="attach_file"
                          className="text-[16px] text-amber-700 dark:text-amber-300"
                        />
                      }
                      onPress={openCommentFilePicker}
                    >
                      Adicionar arquivo
                    </Button>
                  </div>

                  {commentForm.files.length === 0 ? (
                    <p className="text-xs text-foreground/65">
                      Sem anexos para este comentário.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {commentForm.files.map((file, index) => (
                        <div
                          key={`comment-file-${index + 1}`}
                          className="space-y-2 rounded-lg border border-default-200 p-3"
                        >
                          <div className="flex items-center gap-2">
                            <FileFormThumbnail file={file} />
                            <span className="text-xs text-foreground/65">
                              Miniatura
                            </span>
                          </div>
                          <p className="text-xs text-foreground/70">
                            <span className="font-semibold">Arquivo:</span>{" "}
                            <button
                              type="button"
                              className="font-semibold text-primary hover:underline"
                              onClick={() =>
                                openFilePreviewModal(file, {
                                  type: "draft-comment-file",
                                  index,
                                })
                              }
                            >
                              {file.fileName || "-"}
                            </button>
                          </p>

                          <div className="flex justify-end">
                            <Button
                              type="button"
                              size="sm"
                              variant="light"
                              color="danger"
                              startContent={
                                <MaterialSymbol
                                  name="delete"
                                  className="text-[16px]"
                                />
                              }
                              onPress={() => handleRemoveCommentFile(index)}
                            >
                              Remover
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </ModalBody>
              <ModalFooter>
                <Button
                  type="submit"
                  color="primary"
                  isLoading={isSubmittingComment}
                  startContent={
                    <MaterialSymbol
                      name={isEditingComment ? "save" : "send"}
                      className="text-[18px] text-amber-700 dark:text-amber-300"
                    />
                  }
                >
                  {isEditingComment ? "Salvar edição" : "Enviar comentário"}
                </Button>
              </ModalFooter>
            </form>
          )}
        </ModalContent>
      </Modal>

      <Modal
        isOpen={isFilePreviewModalOpen}
        onOpenChange={(open) => {
          setIsFilePreviewModalOpen(open);
          if (!open) {
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
                      startContent={
                        <MaterialSymbol name="open_in_new" className="text-[16px]" />
                      }
                      onPress={() => {
                        window.open(filePreviewOpenUrl, "_blank", "noopener,noreferrer");
                      }}
                    >
                      Abrir
                    </Button>
                  ) : null}
                </div>
              </ModalHeader>

              <ModalBody className="h-full overflow-hidden">
                {filePreview ? (
                  <div className="flex h-full min-h-0 flex-col gap-3">
                    {filePreviewError ? (
                      <div className="rounded-xl border border-danger/30 bg-danger/10 p-3">
                        <p className="text-sm font-medium text-danger">{filePreviewError}</p>
                      </div>
                    ) : null}

                    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-default-200 bg-default-50/50 px-3 py-2">
                      <span className="rounded-full border border-default-300 px-2 py-0.5 text-[11px] font-semibold text-foreground/80">
                        {filePreviewTypeLabel}
                      </span>
                      <span className="text-xs text-foreground/65">
                        {filePreview.contentType || "Tipo não informado"}
                      </span>
                      {filePreview.fileKey && !isDataUrl(filePreview.fileKey) ? (
                        <>
                          <span className="text-xs text-foreground/45" aria-hidden="true">
                            •
                          </span>
                          <span
                            className="max-w-full truncate text-xs text-foreground/65"
                            title={filePreview.fileKey}
                          >
                            Ref: {filePreview.fileKey}
                          </span>
                        </>
                      ) : null}
                    </div>

                    <div className="flex-1 overflow-hidden rounded-xl border border-default-200 bg-black/80">
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
                      ) : selectedModalFilePreviewType === "pdf" &&
                        filePreviewOpenUrl ? (
                        <iframe
                          src={filePreviewOpenUrl}
                          title={filePreview.fileName}
                          className="h-full w-full"
                        />
                      ) : (
                        <div className="flex h-full min-h-64 flex-col items-center justify-center px-4 text-center">
                          <MaterialSymbol
                            name="insert_drive_file"
                            className="text-[40px] text-white/70"
                          />
                          <p className="mt-2 text-sm font-medium text-white/85">
                            Não foi possível exibir a pré-visualização deste arquivo.
                          </p>
                          <p className="mt-1 text-xs text-white/60">
                            Tente abrir o arquivo em nova aba.
                          </p>
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
        isOpen={isCommentFilePickerModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeCommentFilePicker();
          } else {
            setIsCommentFilePickerModalOpen(true);
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
                {commentFilePickerError ? (
                  <div className="rounded-xl border border-danger/30 bg-danger/10 p-3">
                    <p className="text-sm font-medium text-danger">
                      {commentFilePickerError}
                    </p>
                  </div>
                ) : null}

                <div
                  className={`rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors ${
                    isDraggingCommentFile
                      ? "border-primary bg-primary/5"
                      : "border-default-300 bg-default-50/30"
                  }`}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setIsDraggingCommentFile(true);
                  }}
                  onDragLeave={(event) => {
                    event.preventDefault();
                    setIsDraggingCommentFile(false);
                  }}
                  onDrop={onCommentFileDrop}
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
                      ref={commentFileInputRef}
                      type="file"
                      className="hidden"
                      onChange={onCommentFileInputChange}
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="flat"
                      onPress={() => commentFileInputRef.current?.click()}
                      startContent={
                        <MaterialSymbol name="folder_open" className="text-[16px]" />
                      }
                    >
                      Selecionar arquivo
                    </Button>
                  </div>
                </div>

                {selectedLocalCommentFile ? (
                  <div className="space-y-3 rounded-xl border border-default-200 p-3">
                    <p className="text-sm font-semibold text-foreground">Preview</p>

                    {selectedCommentFilePreviewType === "image" ? (
                      <div className="overflow-hidden rounded-lg border border-default-200">
                        <img
                          src={selectedCommentFilePreviewUrl}
                          alt={pendingCommentFile.fileName || "preview do arquivo"}
                          className="max-h-60 w-full object-contain"
                        />
                      </div>
                    ) : selectedCommentFilePreviewType === "pdf" ? (
                      <div className="overflow-hidden rounded-lg border border-default-200">
                        <iframe
                          src={selectedCommentFilePreviewUrl}
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
                        {pendingCommentFile.fileName || selectedLocalCommentFile.name}
                      </p>
                      <Input
                        label="Observações"
                        value={pendingCommentFile.notes}
                        onValueChange={(value) =>
                          setPendingCommentFile((currentFile) => ({
                            ...currentFile,
                            notes: value,
                          }))
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
                    closeCommentFilePicker();
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  color="primary"
                  onPress={confirmAddPickedCommentFile}
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

function FileFormThumbnail({ file }: { file: CommentFileForm }) {
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

function mergeServiceRequest(
  currentRequests: AdminServiceRequest[],
  updatedRequest: AdminServiceRequest,
): AdminServiceRequest[] {
  const hasCurrentRequest = currentRequests.some(
    (request) => request.id === updatedRequest.id,
  );
  if (!hasCurrentRequest) {
    return [updatedRequest, ...currentRequests];
  }

  return currentRequests.map((request) =>
    request.id === updatedRequest.id ? { ...request, ...updatedRequest } : request,
  );
}

function canChangeRequestStatus(status: string): boolean {
  const normalizedStatus = normalizeStatus(status);
  return normalizedStatus !== "concluida" && normalizedStatus !== "cancelada";
}

function normalizeStatus(status: string): string {
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

function statusSortWeight(status: string): number {
  const normalizedStatus = normalizeStatus(status);
  if (normalizedStatus === "aberta") {
    return 0;
  }
  if (normalizedStatus === "em_andamento") {
    return 1;
  }
  if (normalizedStatus === "concluida") {
    return 2;
  }
  if (normalizedStatus === "cancelada") {
    return 3;
  }
  return 4;
}

function formatStatusLabel(status: string): string {
  const normalizedStatus = normalizeStatus(status);
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

function getStatusBadgeClass(status: string): string {
  const normalizedStatus = normalizeStatus(status);
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
  return "bg-default-100 text-foreground/70";
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

function parseDateTime(value: string): number {
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return 0;
  }
  return parsedDate.getTime();
}

function formatDateTime(value?: string): string {
  if (!value) {
    return "-";
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(parsedDate);
}

function canAdminDeleteComment(
  comment: ServiceRequestComment,
  adminUserID: string,
): boolean {
  if (normalizeAuthorType(comment.authorType) !== "user") {
    return false;
  }

  const normalizedCommentUserID = (comment.userId || "").trim();
  if (!normalizedCommentUserID || !adminUserID) {
    return false;
  }

  return normalizedCommentUserID === adminUserID;
}

function canAdminDeleteCommentFile(
  comment: ServiceRequestComment,
  adminUserID: string,
): boolean {
  return canAdminDeleteComment(comment, adminUserID);
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
  const isClient = normalizeAuthorType(authorType) === "client";
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

function normalizeAuthorType(value?: string): "client" | "user" {
  return (value || "").trim().toLowerCase() === "client" ? "client" : "user";
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
    cause instanceof ServiceRequestsMissingSessionError
  ) {
    return cause.message;
  }

  return fallback;
}

function readAdminUserIDFromCookie(): string {
  if (typeof document === "undefined") {
    return "";
  }

  const cookie = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith("admin_user="));
  if (!cookie) {
    return "";
  }

  try {
    const raw = decodeURIComponent(cookie.split("=")[1] || "");
    const parsed = JSON.parse(raw) as { id?: string };
    return (parsed.id || "").trim();
  } catch {
    return "";
  }
}
