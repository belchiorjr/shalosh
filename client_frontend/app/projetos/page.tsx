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
import { ClientApiError, fetchClientApi } from "@/lib/client-api";

interface ProjectSummary {
  id: string;
  name: string;
  objective: string;
  status: string;
  active: boolean;
}

interface ProjectPhase {
  id: string;
  name: string;
  description: string;
  objective: string;
}

interface ProjectTask {
  id: string;
  name: string;
  description: string;
  objective: string;
  projectPhaseId?: string;
  status: string;
}

interface ProjectDetail {
  id: string;
  name: string;
  objective: string;
  status: string;
  phases: ProjectPhase[];
  tasks: ProjectTask[];
}

interface PlanningItem {
  id: string;
  parentId?: string;
  level: number;
  kind: "phase" | "subphase" | "task";
  title: string;
  description: string;
  status: string;
  progressPercent: number;
}

interface ProjectPlanningResponse {
  planning: PlanningItem[];
}

interface TaskCommentFile {
  id: string;
  fileName: string;
  fileKey: string;
  contentType: string;
  notes: string;
}

interface TaskComment {
  id: string;
  projectTaskId: string;
  parentCommentId?: string;
  authorName?: string;
  authorType?: string;
  comment: string;
  files: TaskCommentFile[];
  created: string;
}

interface CommentFileForm {
  fileName: string;
  fileKey: string;
  contentType: string;
  notes: string;
  previewUrl: string;
}

interface TaskModalContext {
  projectId: string;
  projectName: string;
  taskId: string;
  taskName: string;
  breadcrumb: string;
}

interface TaskFilePreviewState {
  fileName: string;
  fileKey: string;
  contentType: string;
  previewUrl: string;
  deleteAction: TaskFilePreviewDeleteAction;
}

type TaskFilePreviewDeleteAction =
  | { type: "none" }
  | { type: "draft-comment-file"; index: number };

function createEmptyCommentFile(): CommentFileForm {
  return {
    fileName: "",
    fileKey: "",
    contentType: "",
    notes: "",
    previewUrl: "",
  };
}

export default function ProjetosPage() {
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [isLoadingProjectData, setIsLoadingProjectData] = useState(false);
  const [isLoadingTaskComments, setIsLoadingTaskComments] = useState(false);
  const [isSubmittingTaskComment, setIsSubmittingTaskComment] = useState(false);
  const [isTaskCommentComposerOpen, setIsTaskCommentComposerOpen] = useState(false);
  const [isTaskFilePickerModalOpen, setIsTaskFilePickerModalOpen] = useState(false);
  const [isTaskFilePreviewModalOpen, setIsTaskFilePreviewModalOpen] = useState(false);
  const [isDraggingTaskFile, setIsDraggingTaskFile] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [taskCommentError, setTaskCommentError] = useState<string | null>(null);
  const [taskFilePickerError, setTaskFilePickerError] = useState<string | null>(null);
  const [taskFilePreviewError, setTaskFilePreviewError] = useState<string | null>(null);

  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [projectQuery, setProjectQuery] = useState("");
  const [projectStatusFilter, setProjectStatusFilter] = useState("all");

  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [projectDetail, setProjectDetail] = useState<ProjectDetail | null>(null);
  const [planningItems, setPlanningItems] = useState<PlanningItem[]>([]);

  const [isProjectTreeModalOpen, setIsProjectTreeModalOpen] = useState(false);

  const [taskModalContext, setTaskModalContext] = useState<TaskModalContext | null>(null);
  const [taskComments, setTaskComments] = useState<TaskComment[]>([]);
  const [taskCommentText, setTaskCommentText] = useState("");
  const [taskReplyToCommentId, setTaskReplyToCommentId] = useState("");
  const [taskCommentFiles, setTaskCommentFiles] = useState<CommentFileForm[]>([]);
  const [hoveredReplyTaskCommentId, setHoveredReplyTaskCommentId] = useState("");

  const [selectedTaskLocalFile, setSelectedTaskLocalFile] = useState<File | null>(null);
  const [selectedTaskFilePreviewUrl, setSelectedTaskFilePreviewUrl] = useState("");
  const [pendingTaskFile, setPendingTaskFile] = useState<CommentFileForm>(createEmptyCommentFile());
  const [taskFilePreview, setTaskFilePreview] = useState<TaskFilePreviewState | null>(null);
  const [taskImagePreviewZoom, setTaskImagePreviewZoom] = useState(1);
  const [taskImagePreviewPan, setTaskImagePreviewPan] = useState({ x: 0, y: 0 });
  const [isTaskImagePreviewDragging, setIsTaskImagePreviewDragging] = useState(false);

  const taskFileInputRef = useRef<HTMLInputElement>(null);
  const taskImagePreviewDragRef = useRef({
    active: false,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
  });
  const taskImagePreviewPanRef = useRef({ x: 0, y: 0 });
  const taskImagePreviewPendingPanRef = useRef<{ x: number; y: number } | null>(null);
  const taskImagePreviewPanFrameRef = useRef<number | null>(null);

  useEffect(() => {
    void loadProjects();
  }, []);

  const filteredProjects = useMemo(() => {
    const normalizedQuery = projectQuery.trim().toLowerCase();

    return projects.filter((project) => {
      const statusMatches =
        projectStatusFilter === "all" ||
        normalizeProjectStatus(project.status) === projectStatusFilter;
      const queryMatches =
        normalizedQuery === "" ||
        project.name.toLowerCase().includes(normalizedQuery) ||
        (project.objective || "").toLowerCase().includes(normalizedQuery);

      return statusMatches && queryMatches;
    });
  }, [projectQuery, projectStatusFilter, projects]);

  const planningItemsByID = useMemo(() => {
    const map = new Map<string, PlanningItem>();
    for (const item of planningItems) {
      map.set(item.id, item);
    }
    return map;
  }, [planningItems]);

  const treeItems = useMemo(() => {
    if (planningItems.length > 0) {
      return planningItems;
    }

    if (!projectDetail?.tasks || projectDetail.tasks.length === 0) {
      return [] as PlanningItem[];
    }

    return projectDetail.tasks.map((task) => ({
      id: task.id,
      parentId: task.projectPhaseId,
      level: 0,
      kind: "task" as const,
      title: task.name,
      description: task.description || task.objective || "",
      status: task.status || "-",
      progressPercent: 0,
    }));
  }, [planningItems, projectDetail?.tasks]);

  useEffect(() => {
    return () => {
      releaseFilePreview(selectedTaskFilePreviewUrl);
    };
  }, [selectedTaskFilePreviewUrl]);

  useEffect(() => {
    taskImagePreviewPanRef.current = taskImagePreviewPan;
  }, [taskImagePreviewPan]);

  useEffect(() => {
    return () => {
      if (taskImagePreviewPanFrameRef.current !== null) {
        window.cancelAnimationFrame(taskImagePreviewPanFrameRef.current);
      }
    };
  }, []);

  const taskCommentsByID = useMemo(() => {
    const commentMap = new Map<string, TaskComment>();
    taskComments.forEach((comment) => {
      commentMap.set(comment.id, comment);
    });
    return commentMap;
  }, [taskComments]);

  const orderedTaskComments = useMemo(
    () => orderTaskCommentsWithReplies(taskComments),
    [taskComments],
  );

  const selectedTaskReplyComment = useMemo(
    () => taskComments.find((comment) => comment.id === taskReplyToCommentId) || null,
    [taskComments, taskReplyToCommentId],
  );

  const selectedTaskPreviewType = useMemo(
    () =>
      resolveFilePreviewType(
        pendingTaskFile.contentType,
        pendingTaskFile.fileName,
        pendingTaskFile.previewUrl,
        pendingTaskFile.fileKey,
      ),
    [
      pendingTaskFile.contentType,
      pendingTaskFile.fileName,
      pendingTaskFile.previewUrl,
      pendingTaskFile.fileKey,
    ],
  );

  const selectedTaskModalPreviewType = useMemo(
    () =>
      resolveFilePreviewType(
        taskFilePreview?.contentType || "",
        taskFilePreview?.fileName || "",
        taskFilePreview?.previewUrl || "",
        taskFilePreview?.fileKey || "",
      ),
    [
      taskFilePreview?.contentType,
      taskFilePreview?.fileName,
      taskFilePreview?.previewUrl,
      taskFilePreview?.fileKey,
    ],
  );

  const taskFilePreviewResolvedUrl = useMemo(() => {
    if (!taskFilePreview) {
      return "";
    }

    return resolveFilePreviewUrl(taskFilePreview.previewUrl, taskFilePreview.fileKey);
  }, [taskFilePreview]);

  const taskFilePreviewOpenUrl = useMemo(() => {
    if (!taskFilePreviewResolvedUrl) {
      return "";
    }

    if (isDataUrl(taskFilePreviewResolvedUrl)) {
      return convertDataUrlToBlobUrl(taskFilePreviewResolvedUrl);
    }

    return taskFilePreviewResolvedUrl;
  }, [taskFilePreviewResolvedUrl]);

  useEffect(() => {
    if (!taskFilePreviewOpenUrl.startsWith("blob:")) {
      return;
    }

    return () => {
      URL.revokeObjectURL(taskFilePreviewOpenUrl);
    };
  }, [taskFilePreviewOpenUrl]);

  const loadProjects = async () => {
    setIsLoadingProjects(true);
    setError(null);

    try {
      const payload = await fetchClientApi<ProjectSummary[]>("/client/projects");
      const list = Array.isArray(payload) ? payload : [];
      setProjects(list);
    } catch (requestError) {
      if (requestError instanceof ClientApiError) {
        setError(requestError.message);
      } else {
        setError("Falha de conexão com a API.");
      }
    } finally {
      setIsLoadingProjects(false);
    }
  };

  const loadProjectData = async (projectID: string) => {
    setIsLoadingProjectData(true);
    setError(null);

    try {
      const [detail, planning] = await Promise.all([
        fetchClientApi<ProjectDetail>(`/client/projects/${projectID}`),
        fetchClientApi<ProjectPlanningResponse>(`/client/projects/${projectID}/planning`),
      ]);

      setProjectDetail(detail);
      setPlanningItems(Array.isArray(planning?.planning) ? planning.planning : []);
    } catch (requestError) {
      if (requestError instanceof ClientApiError) {
        setError(requestError.message);
      } else {
        setError("Falha de conexão com a API.");
      }
    } finally {
      setIsLoadingProjectData(false);
    }
  };

  const handleOpenProjectTree = async (project: ProjectSummary) => {
    setSelectedProjectId(project.id);
    setIsProjectTreeModalOpen(true);
    await loadProjectData(project.id);
  };

  const loadTaskComments = async (projectID: string, taskID: string) => {
    setIsLoadingTaskComments(true);
    setTaskCommentError(null);

    try {
      const payload = await fetchClientApi<TaskComment[]>(
        `/client/projects/${projectID}/tasks/${taskID}/comments`,
      );
      setTaskComments(Array.isArray(payload) ? payload : []);
    } catch (requestError) {
      if (requestError instanceof ClientApiError) {
        setTaskCommentError(requestError.message);
      } else {
        setTaskCommentError("Falha de conexão com a API.");
      }
    } finally {
      setIsLoadingTaskComments(false);
    }
  };

  const openTaskCommentsModal = async (taskItem: PlanningItem) => {
    if (!selectedProjectId) {
      return;
    }

    const projectName = projectDetail?.name || "Projeto";
    const breadcrumb = buildTaskBreadcrumb(taskItem, planningItemsByID);

    setTaskModalContext({
      projectId: selectedProjectId,
      projectName,
      taskId: taskItem.id,
      taskName: taskItem.title,
      breadcrumb,
    });
    setTaskCommentText("");
    setTaskReplyToCommentId("");
    setTaskCommentFiles([]);
    setTaskComments([]);
    setTaskCommentError(null);
    setHoveredReplyTaskCommentId("");
    setIsTaskCommentComposerOpen(false);

    await loadTaskComments(selectedProjectId, taskItem.id);
  };

  const closeTaskCommentsModal = () => {
    setTaskModalContext(null);
    setTaskCommentText("");
    setTaskReplyToCommentId("");
    setTaskCommentFiles([]);
    setTaskComments([]);
    setTaskCommentError(null);
    setHoveredReplyTaskCommentId("");
    setIsTaskCommentComposerOpen(false);
    closeTaskFilePicker();
    setIsTaskFilePreviewModalOpen(false);
    setTaskFilePreview(null);
    setTaskFilePreviewError(null);
    setTaskImagePreviewZoom(1);
    resetTaskImagePreviewPanState();
  };

  const openNewTaskCommentComposer = () => {
    setTaskCommentText("");
    setTaskReplyToCommentId("");
    setTaskCommentFiles([]);
    setTaskCommentError(null);
    setIsTaskCommentComposerOpen(true);
  };

  const openReplyTaskCommentComposer = (parentCommentID: string) => {
    setTaskCommentText("");
    setTaskReplyToCommentId(parentCommentID);
    setTaskCommentFiles([]);
    setTaskCommentError(null);
    setIsTaskCommentComposerOpen(true);
  };

  const openTaskFilePicker = () => {
    setSelectedTaskLocalFile(null);
    setPendingTaskFile(createEmptyCommentFile());
    setTaskFilePickerError(null);
    releaseFilePreview(selectedTaskFilePreviewUrl);
    setSelectedTaskFilePreviewUrl("");
    setIsDraggingTaskFile(false);
    setIsTaskFilePickerModalOpen(true);
  };

  const closeTaskFilePicker = () => {
    releaseFilePreview(selectedTaskFilePreviewUrl);
    setSelectedTaskFilePreviewUrl("");
    setSelectedTaskLocalFile(null);
    setPendingTaskFile(createEmptyCommentFile());
    setTaskFilePickerError(null);
    setIsDraggingTaskFile(false);
    setIsTaskFilePickerModalOpen(false);
  };

  const onTaskFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (!file) {
      return;
    }
    void loadSelectedTaskFile(file);
    event.target.value = "";
  };

  const onTaskFileDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingTaskFile(false);
    const file = event.dataTransfer.files?.[0] || null;
    if (!file) {
      return;
    }
    void loadSelectedTaskFile(file);
  };

  const loadSelectedTaskFile = async (file: File) => {
    const normalizedName = normalizeFileNameForKey(file.name);
    const generatedKey = generateFileStorageKey(normalizedName);
    const previewUrl = await buildPreviewDataUrl(file);

    releaseFilePreview(selectedTaskFilePreviewUrl);
    setSelectedTaskLocalFile(file);
    setPendingTaskFile({
      fileName: file.name,
      fileKey: generatedKey,
      contentType: file.type || "",
      notes: "",
      previewUrl,
    });
    setSelectedTaskFilePreviewUrl(previewUrl);
    setTaskFilePickerError(null);
  };

  const confirmAddPickedTaskFile = () => {
    const normalizedFileName = pendingTaskFile.fileName.trim();
    if (!normalizedFileName) {
      setTaskFilePickerError("Selecione um arquivo para adicionar.");
      return;
    }

    const normalizedPreviewUrl = (
      pendingTaskFile.previewUrl || selectedTaskFilePreviewUrl
    ).trim();
    const normalizedFileKey =
      normalizedPreviewUrl ||
      pendingTaskFile.fileKey.trim() ||
      generateFileStorageKey(normalizeFileNameForKey(normalizedFileName));

    const normalizedFile: CommentFileForm = {
      fileName: normalizedFileName,
      fileKey: normalizedFileKey,
      contentType: pendingTaskFile.contentType.trim(),
      notes: pendingTaskFile.notes.trim(),
      previewUrl: pendingTaskFile.previewUrl || selectedTaskFilePreviewUrl || "",
    };

    setTaskCommentFiles((current) => [...current, normalizedFile]);
    closeTaskFilePicker();
  };

  const removeTaskCommentFile = (index: number) => {
    setTaskCommentFiles((current) =>
      current.filter((_, currentIndex) => currentIndex !== index),
    );
  };

  const openTaskFilePreviewModal = (
    file: {
      fileName?: string;
      fileKey?: string;
      contentType?: string;
      previewUrl?: string;
    },
    deleteAction: TaskFilePreviewDeleteAction = { type: "none" },
  ) => {
    const fileName = (file.fileName || "").trim() || "arquivo";
    const fileKey = (file.fileKey || "").trim();
    const contentType = (file.contentType || "").trim();
    const previewUrl = resolveFilePreviewUrl(file.previewUrl || "", fileKey);

    setTaskFilePreviewError(null);
    setTaskFilePreview({
      fileName,
      fileKey,
      contentType,
      previewUrl,
      deleteAction,
    });
    setTaskImagePreviewZoom(1);
    resetTaskImagePreviewPanState();
    setIsTaskFilePreviewModalOpen(true);
  };

  const zoomOutTaskImagePreview = () => {
    setTaskImagePreviewZoom((currentZoom) =>
      Math.max(1, Number((currentZoom - 0.25).toFixed(2))),
    );
  };

  const zoomInTaskImagePreview = () => {
    setTaskImagePreviewZoom((currentZoom) =>
      Math.min(5, Number((currentZoom + 0.25).toFixed(2))),
    );
  };

  const queueTaskImagePreviewPan = (nextPan: { x: number; y: number }) => {
    taskImagePreviewPendingPanRef.current = nextPan;
    if (taskImagePreviewPanFrameRef.current !== null) {
      return;
    }

    taskImagePreviewPanFrameRef.current = window.requestAnimationFrame(() => {
      taskImagePreviewPanFrameRef.current = null;
      const pendingPan = taskImagePreviewPendingPanRef.current;
      if (!pendingPan) {
        return;
      }
      taskImagePreviewPendingPanRef.current = null;
      taskImagePreviewPanRef.current = pendingPan;
      setTaskImagePreviewPan(pendingPan);
    });
  };

  const resetTaskImagePreviewPanState = () => {
    if (taskImagePreviewPanFrameRef.current !== null) {
      window.cancelAnimationFrame(taskImagePreviewPanFrameRef.current);
      taskImagePreviewPanFrameRef.current = null;
    }
    taskImagePreviewPendingPanRef.current = null;
    taskImagePreviewPanRef.current = { x: 0, y: 0 };
    setTaskImagePreviewPan({ x: 0, y: 0 });
    setIsTaskImagePreviewDragging(false);
    taskImagePreviewDragRef.current.active = false;
  };

  const resetTaskImagePreviewZoom = () => {
    setTaskImagePreviewZoom(1);
    resetTaskImagePreviewPanState();
  };

  const onTaskImagePreviewWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    if (selectedTaskModalPreviewType !== "image") {
      return;
    }
    event.preventDefault();

    const shouldZoom =
      event.ctrlKey || event.metaKey || event.altKey || taskImagePreviewZoom <= 1;
    if (shouldZoom) {
      const zoomDelta = event.deltaY < 0 ? 0.15 : -0.15;
      setTaskImagePreviewZoom((currentZoom) =>
        Math.min(5, Math.max(1, Number((currentZoom + zoomDelta).toFixed(2)))),
      );
      return;
    }

    queueTaskImagePreviewPan({
      x: taskImagePreviewPanRef.current.x - event.deltaX,
      y: taskImagePreviewPanRef.current.y - event.deltaY,
    });
  };

  const onTaskImagePreviewMouseDown = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (selectedTaskModalPreviewType !== "image" || taskImagePreviewZoom <= 1) {
      return;
    }

    event.preventDefault();
    taskImagePreviewDragRef.current = {
      active: true,
      startX: event.clientX,
      startY: event.clientY,
      originX: taskImagePreviewPanRef.current.x,
      originY: taskImagePreviewPanRef.current.y,
    };
    setIsTaskImagePreviewDragging(true);
  };

  const onTaskImagePreviewMouseMove = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (!taskImagePreviewDragRef.current.active) {
      return;
    }

    event.preventDefault();
    const deltaX = event.clientX - taskImagePreviewDragRef.current.startX;
    const deltaY = event.clientY - taskImagePreviewDragRef.current.startY;
    queueTaskImagePreviewPan({
      x: taskImagePreviewDragRef.current.originX + deltaX,
      y: taskImagePreviewDragRef.current.originY + deltaY,
    });
  };

  const onTaskImagePreviewMouseUp = () => {
    if (!taskImagePreviewDragRef.current.active) {
      return;
    }

    taskImagePreviewDragRef.current.active = false;
    setIsTaskImagePreviewDragging(false);
  };

  useEffect(() => {
    if (taskImagePreviewZoom > 1) {
      return;
    }

    resetTaskImagePreviewPanState();
  }, [taskImagePreviewZoom]);

  const deleteTaskPreviewFile = () => {
    if (!taskFilePreview || taskFilePreview.deleteAction.type !== "draft-comment-file") {
      return;
    }

    removeTaskCommentFile(taskFilePreview.deleteAction.index);
    setIsTaskFilePreviewModalOpen(false);
    setTaskFilePreview(null);
  };

  const submitTaskComment = async () => {
    if (!taskModalContext) {
      return;
    }

    if (!taskCommentText.trim()) {
      setTaskCommentError("Informe um comentário.");
      return;
    }

    setIsSubmittingTaskComment(true);
    setTaskCommentError(null);

    try {
      const normalizedTaskCommentFiles = taskCommentFiles
        .map((file) => ({
          fileName: file.fileName.trim(),
          fileKey: file.fileKey.trim(),
          contentType: file.contentType.trim(),
          notes: file.notes.trim(),
        }))
        .filter((file) => file.fileName || file.fileKey);

      await fetchClientApi<TaskComment>(
        `/client/projects/${taskModalContext.projectId}/tasks/${taskModalContext.taskId}/comments`,
        {
          method: "POST",
          body: JSON.stringify({
            parentCommentId: taskReplyToCommentId || "",
            comment: taskCommentText.trim(),
            files: normalizedTaskCommentFiles,
          }),
        },
      );

      setTaskCommentText("");
      setTaskReplyToCommentId("");
      setTaskCommentFiles([]);
      setIsTaskCommentComposerOpen(false);
      await loadTaskComments(taskModalContext.projectId, taskModalContext.taskId);
    } catch (requestError) {
      if (requestError instanceof ClientApiError) {
        setTaskCommentError(requestError.message);
      } else {
        setTaskCommentError("Falha de conexão com a API.");
      }
    } finally {
      setIsSubmittingTaskComment(false);
    }
  };

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-sky-200 bg-sky-100 text-sky-700 dark:border-sky-900/70 dark:bg-sky-950/40 dark:text-sky-300">
            <MaterialSymbol
              name="workspaces"
              className="text-[24px] text-sky-700 dark:text-sky-300"
            />
          </div>
          <h1 className="text-2xl font-semibold text-foreground">Projetos</h1>
        </div>
        <p className="text-sm text-foreground/70">
          Consulte projetos vinculados e abra a árvore de fases e tarefas para comentar.
        </p>
      </header>

      {error ? (
        <Card className="border border-danger/30 bg-danger/10">
          <CardBody>
            <p className="text-sm font-medium text-danger">{error}</p>
          </CardBody>
        </Card>
      ) : null}

      <Card className="border border-default-200">
        <CardBody className="space-y-4">
          <div className="grid gap-3 md:grid-cols-[1fr_220px_auto] md:items-end">
            <Input
              label="Consulta de projetos"
              value={projectQuery}
              onValueChange={setProjectQuery}
              placeholder="Buscar por nome ou objetivo"
              startContent={<MaterialSymbol name="search" className="text-[18px]" />}
              classNames={{
                inputWrapper: "h-14 min-h-14",
              }}
            />

            <div>
              <select
                value={projectStatusFilter}
                onChange={(event) => setProjectStatusFilter(event.target.value)}
                aria-label="Filtrar por status"
                className="h-14 w-full rounded-xl border border-default-200 bg-content1 px-3 text-sm text-foreground outline-none transition-colors focus:border-primary"
              >
                <option value="all">Todos</option>
                <option value="planejamento">Planejamento</option>
                <option value="andamento">Em andamento</option>
                <option value="concluido">Concluído</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>

            <Button
              type="button"
              variant="flat"
              className="h-14 min-h-14 px-4"
              onPress={() => {
                setProjectQuery("");
                setProjectStatusFilter("all");
              }}
              startContent={<MaterialSymbol name="refresh" className="text-[18px]" />}
            >
              Limpar
            </Button>
          </div>

          {isLoadingProjects ? (
            <div className="flex items-center gap-2 text-sm text-foreground/70">
              <Spinner size="sm" /> Carregando projetos vinculados...
            </div>
          ) : null}

          {!isLoadingProjects && filteredProjects.length === 0 ? (
            <p className="text-sm text-foreground/70">Nenhum projeto vinculado encontrado.</p>
          ) : null}

          {!isLoadingProjects && filteredProjects.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-default-200">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-default-200 bg-default-50 text-left text-foreground/70">
                    <th className="px-2 py-2 font-medium">Projeto</th>
                    <th className="px-2 py-2 font-medium">Status</th>
                    <th className="px-2 py-2 font-medium">Objetivo</th>
                    <th className="px-2 py-2 text-right font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProjects.map((project) => (
                    <tr key={project.id} className="border-b border-default-100 align-top">
                      <td className="px-2 py-2">
                        <p className="font-semibold text-foreground">{project.name}</p>
                      </td>
                      <td className="px-2 py-2 text-xs text-foreground/75">
                        {projectStatusLabel(project.status)}
                      </td>
                      <td className="px-2 py-2 text-xs text-foreground/70">
                        {truncate(project.objective || "-", 96)}
                      </td>
                      <td className="px-2 py-2 text-right">
                        <Dropdown placement="bottom-end">
                          <DropdownTrigger>
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                              aria-label="Abrir ações do projeto"
                            >
                              <MaterialSymbol name="more_vert" className="text-[20px]" />
                            </Button>
                          </DropdownTrigger>
                          <DropdownMenu
                            aria-label="Ações do projeto"
                            onAction={(key) => {
                              if (String(key) === "phases_tasks") {
                                void handleOpenProjectTree(project);
                              }
                            }}
                          >
                            <DropdownItem
                              key="phases_tasks"
                              startContent={
                                <MaterialSymbol name="account_tree" className="text-[18px]" />
                              }
                            >
                              Fases e tarefas
                            </DropdownItem>
                          </DropdownMenu>
                        </Dropdown>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </CardBody>
      </Card>

      <Modal
        isOpen={isProjectTreeModalOpen}
        onOpenChange={(isOpen) => {
          setIsProjectTreeModalOpen(isOpen);
          if (!isOpen) {
            setSelectedProjectId("");
            setProjectDetail(null);
            setPlanningItems([]);
          }
        }}
        placement="center"
        size="5xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          {(closeModal) => (
            <>
              <ModalHeader className="flex items-center gap-2">
                <MaterialSymbol name="account_tree" className="text-[20px]" />
                Fases e tarefas {projectDetail?.name ? `- ${projectDetail.name}` : ""}
              </ModalHeader>

              <ModalBody className="space-y-3">
                {isLoadingProjectData ? (
                  <div className="flex items-center gap-2 text-sm text-foreground/70">
                    <Spinner size="sm" /> Carregando árvore do projeto...
                  </div>
                ) : null}

                {!isLoadingProjectData && treeItems.length === 0 ? (
                  <p className="text-sm text-foreground/70">Nenhuma fase/tarefa disponível neste projeto.</p>
                ) : null}

                {!isLoadingProjectData && treeItems.length > 0 ? (
                  <div className="overflow-x-auto rounded-xl border border-default-200">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b border-default-200 bg-default-50 text-left text-foreground/70">
                          <th className="px-2 py-2 font-medium">Estrutura</th>
                          <th className="px-2 py-2 font-medium">Tipo</th>
                          <th className="px-2 py-2 font-medium">Status</th>
                          <th className="px-2 py-2 font-medium">Progresso</th>
                          <th className="px-2 py-2 text-right font-medium">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {treeItems.map((item) => (
                          <tr key={item.id} className="border-b border-default-100 align-top">
                            <td className="px-2 py-2">
                              <div
                                className="space-y-1"
                                style={{ paddingLeft: `${Math.max(item.level, 0) * 16}px` }}
                              >
                                <div className="flex items-center gap-2">
                                  <MaterialSymbol
                                    name={item.kind === "task" ? "check_box" : "folder"}
                                    className="text-[16px] text-foreground/70"
                                  />
                                  <p className="font-medium text-foreground">{item.title}</p>
                                </div>
                                <p className="text-xs text-foreground/70">{item.description || "-"}</p>
                              </div>
                            </td>
                            <td className="px-2 py-2 text-xs text-foreground/75">{kindLabel(item.kind)}</td>
                            <td className="px-2 py-2 text-xs text-foreground/75">{item.status || "-"}</td>
                            <td className="px-2 py-2 text-xs text-foreground/75">
                              {item.progressPercent || 0}%
                            </td>
                            <td className="px-2 py-2 text-right">
                              {item.kind === "task" ? (
                                <Button
                                  isIconOnly
                                  size="sm"
                                  variant="light"
                                  aria-label="Abrir comentários da tarefa"
                                  onPress={() => void openTaskCommentsModal(item)}
                                >
                                  <MaterialSymbol name="comment" className="text-[18px]" />
                                </Button>
                              ) : (
                                <span className="text-xs text-foreground/45">-</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}
              </ModalBody>

              <ModalFooter>
                <Button type="button" variant="light" onPress={closeModal}>
                  Fechar
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      <Modal
        isOpen={Boolean(taskModalContext)}
        onOpenChange={(isOpen) => {
          if (!isOpen && !isSubmittingTaskComment) {
            closeTaskCommentsModal();
          }
        }}
        placement="center"
        size="4xl"
        scrollBehavior="inside"
        isDismissable={!isSubmittingTaskComment}
        hideCloseButton={isSubmittingTaskComment}
      >
        <ModalContent>
          {(closeModal) => (
            <>
              <ModalHeader className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-2">
                  <MaterialSymbol name="comment" className="text-[20px]" />
                  Comentários da tarefa
                </span>
                <Button
                  type="button"
                  size="sm"
                  color="primary"
                  onPress={openNewTaskCommentComposer}
                  startContent={
                    <MaterialSymbol
                      name="add_comment"
                      className="text-[17px] text-amber-700 dark:text-amber-300"
                    />
                  }
                >
                  Adicionar comentário
                </Button>
              </ModalHeader>

              <ModalBody className="space-y-4">
                <div className="space-y-1 rounded-xl border border-default-200 p-3">
                  <p className="text-xs font-medium text-foreground/70">
                    {taskModalContext?.projectName || "-"}
                  </p>
                  <p className="text-xs text-foreground/70">{taskModalContext?.breadcrumb || "-"}</p>
                  <p className="text-sm font-semibold text-foreground">
                    {taskModalContext?.taskName || "-"}
                  </p>
                </div>

                {taskCommentError ? (
                  <div className="rounded-xl border border-danger/30 bg-danger/10 p-3">
                    <p className="text-sm font-medium text-danger">{taskCommentError}</p>
                  </div>
                ) : null}

                <div className="space-y-2 rounded-xl border border-default-200 p-3">
                  <p className="text-sm font-semibold text-foreground">
                    Histórico ({taskComments.length})
                  </p>

                  {isLoadingTaskComments ? (
                    <p className="text-sm text-foreground/70">Carregando comentários...</p>
                  ) : null}

                  {!isLoadingTaskComments && taskComments.length === 0 ? (
                    <p className="text-sm text-foreground/70">
                      Nenhum comentário cadastrado para esta tarefa.
                    </p>
                  ) : null}

                  {!isLoadingTaskComments && orderedTaskComments.length > 0 ? (
                    <div className="divide-y divide-default-200/70">
                      {orderedTaskComments.map((comment) => {
                        const replyDepth = getTaskCommentReplyDepth(comment, taskCommentsByID);

                        return (
                          <div
                            key={comment.id}
                            className={`rounded-lg p-[5px] transition-colors duration-150 ${
                              replyDepth > 0 ? "border-l-2 border-primary/25" : ""
                            } ${
                              hoveredReplyTaskCommentId === comment.id
                                ? "bg-default-100/80 dark:bg-default-100/20"
                                : ""
                            }`}
                            style={{
                              marginLeft: `${Math.min(replyDepth, 3) * 20}px`,
                            }}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex flex-wrap items-center justify-start gap-x-1.5 gap-y-1 text-[11px] text-foreground/60">
                                <span className="inline-flex items-center gap-1">
                                  <MaterialSymbol
                                    name={
                                      (comment.authorType || "").trim().toLowerCase() === "client"
                                        ? "person"
                                        : "support_agent"
                                    }
                                    className={`text-[14px] ${
                                      (comment.authorType || "").trim().toLowerCase() === "client"
                                        ? "text-amber-700 dark:text-amber-300"
                                        : "text-sky-700 dark:text-sky-300"
                                    }`}
                                  />
                                  <span
                                    className={`text-xs font-semibold ${
                                      (comment.authorType || "").trim().toLowerCase() === "client"
                                        ? "text-amber-700 dark:text-amber-300"
                                        : "text-sky-700 dark:text-sky-300"
                                    }`}
                                  >
                                    {authorLabel(comment)}
                                  </span>
                                </span>
                                <span className="text-[11px] text-foreground/40" aria-hidden="true">
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

                              <Dropdown placement="bottom-end">
                                <DropdownTrigger>
                                  <Button
                                    isIconOnly
                                    size="sm"
                                    variant="light"
                                    aria-label="Ações do comentário da tarefa"
                                    onMouseEnter={() => setHoveredReplyTaskCommentId(comment.id)}
                                    onMouseLeave={() => setHoveredReplyTaskCommentId("")}
                                  >
                                    <MaterialSymbol name="more_vert" className="text-[18px]" />
                                  </Button>
                                </DropdownTrigger>
                                <DropdownMenu
                                  aria-label="Ações do comentário da tarefa"
                                  onAction={(key) => {
                                    if (String(key) === "reply") {
                                      openReplyTaskCommentComposer(comment.id);
                                    }
                                  }}
                                >
                                  <DropdownItem
                                    key="reply"
                                    startContent={
                                      <MaterialSymbol name="reply" className="text-[17px] text-primary" />
                                    }
                                  >
                                    Responder
                                  </DropdownItem>
                                </DropdownMenu>
                              </Dropdown>
                            </div>

                            <p className="mt-1.5 whitespace-pre-wrap text-sm leading-6 text-foreground/90">
                              {comment.comment}
                            </p>

                            {comment.files.length > 0 ? (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {comment.files.map((file) => (
                                  <button
                                    type="button"
                                    key={file.id}
                                    onClick={() => {
                                      openTaskFilePreviewModal(file, { type: "none" });
                                    }}
                                    title={file.fileName || "arquivo"}
                                    className="rounded-full border border-default-300 px-2 py-0.5 text-[11px] text-foreground/75 transition-colors hover:border-primary/60 hover:text-primary"
                                  >
                                    {file.fileName || file.fileKey || "arquivo"}
                                  </button>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              </ModalBody>

              <ModalFooter>
                <Button
                  variant="light"
                  isDisabled={isSubmittingTaskComment}
                  onPress={() => {
                    closeModal();
                    closeTaskCommentsModal();
                  }}
                >
                  Fechar
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      <Modal
        isOpen={isTaskCommentComposerOpen}
        onOpenChange={(isOpen) => {
          setIsTaskCommentComposerOpen(isOpen);
          if (!isOpen && !isSubmittingTaskComment) {
            setTaskCommentText("");
            setTaskReplyToCommentId("");
            setTaskCommentFiles([]);
            setTaskCommentError(null);
          }
        }}
        placement="center"
        size="3xl"
        scrollBehavior="inside"
        isDismissable={!isSubmittingTaskComment}
        hideCloseButton={isSubmittingTaskComment}
      >
        <ModalContent>
          {(closeModal) => (
            <>
              <ModalHeader className="flex items-center gap-2">
                <MaterialSymbol
                  name={selectedTaskReplyComment ? "reply" : "add_comment"}
                  className="text-[20px] text-amber-700 dark:text-amber-300"
                />
                {selectedTaskReplyComment ? "Responder comentário" : "Novo comentário"}
              </ModalHeader>

              <ModalBody className="space-y-4">
                {selectedTaskReplyComment ? (
                  <div className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2">
                    <p className="text-xs text-foreground/80">
                      Respondendo a{" "}
                      <span className="font-semibold">
                        {authorLabel(selectedTaskReplyComment)}
                      </span>
                      : "{truncate(selectedTaskReplyComment.comment, 80)}"
                    </p>
                  </div>
                ) : null}

                {taskCommentError ? (
                  <div className="rounded-xl border border-danger/30 bg-danger/10 p-3">
                    <p className="text-sm font-medium text-danger">{taskCommentError}</p>
                  </div>
                ) : null}

                <Textarea
                  label="Descrição"
                  value={taskCommentText}
                  onValueChange={setTaskCommentText}
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
                      onPress={openTaskFilePicker}
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

                  {taskCommentFiles.length === 0 ? (
                    <p className="text-xs text-foreground/70">Sem anexos no comentário.</p>
                  ) : null}

                  {taskCommentFiles.map((file, index) => (
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
                            openTaskFilePreviewModal(file, {
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
                          onClick={() => removeTaskCommentFile(index)}
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
                  isLoading={isSubmittingTaskComment}
                  onPress={submitTaskComment}
                  startContent={
                    isSubmittingTaskComment ? null : (
                      <MaterialSymbol
                        name="send"
                        className="text-[18px] text-amber-700 dark:text-amber-300"
                      />
                    )
                  }
                >
                  Enviar comentário
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      <Modal
        isOpen={isTaskFilePreviewModalOpen}
        onOpenChange={(isOpen) => {
          setIsTaskFilePreviewModalOpen(isOpen);
          if (!isOpen) {
            setTaskFilePreview(null);
            setTaskFilePreviewError(null);
            setTaskImagePreviewZoom(1);
            resetTaskImagePreviewPanState();
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
                      {taskFilePreview?.fileName || "-"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {selectedTaskModalPreviewType === "image" ? (
                    <>
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        aria-label="Diminuir zoom da imagem"
                        onPress={zoomOutTaskImagePreview}
                        isDisabled={taskImagePreviewZoom <= 1}
                      >
                        <MaterialSymbol name="zoom_out" className="text-[16px]" />
                      </Button>
                      <span className="min-w-[58px] text-center text-xs font-semibold text-foreground/80">
                        {Math.round(taskImagePreviewZoom * 100)}%
                      </span>
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        aria-label="Aumentar zoom da imagem"
                        onPress={zoomInTaskImagePreview}
                        isDisabled={taskImagePreviewZoom >= 5}
                      >
                        <MaterialSymbol name="zoom_in" className="text-[16px]" />
                      </Button>
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        aria-label="Resetar zoom da imagem"
                        onPress={resetTaskImagePreviewZoom}
                        isDisabled={taskImagePreviewZoom === 1}
                      >
                        <MaterialSymbol name="restart_alt" className="text-[16px]" />
                      </Button>
                    </>
                  ) : null}
                  {taskFilePreviewOpenUrl ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="flat"
                      startContent={<MaterialSymbol name="open_in_new" className="text-[16px]" />}
                      onPress={() => {
                        window.open(taskFilePreviewOpenUrl, "_blank", "noopener,noreferrer");
                      }}
                    >
                      Abrir
                    </Button>
                  ) : null}
                </div>
              </ModalHeader>

              <ModalBody className="h-full overflow-auto">
                {taskFilePreview ? (
                  <div className="flex h-full flex-col gap-3">
                    {taskFilePreviewError ? (
                      <div className="rounded-xl border border-danger/30 bg-danger/10 p-3">
                        <p className="text-sm font-medium text-danger">{taskFilePreviewError}</p>
                      </div>
                    ) : null}

                    <div className="flex-1 overflow-hidden rounded-xl border border-default-200 bg-default-50/40 dark:bg-default-100/5">
                      {selectedTaskModalPreviewType === "image" && taskFilePreviewOpenUrl ? (
                        <div
                          className={`flex h-full w-full items-center justify-center overflow-hidden p-2 ${
                            taskImagePreviewZoom > 1
                              ? isTaskImagePreviewDragging
                                ? "cursor-grabbing"
                                : "cursor-grab"
                              : "cursor-default"
                          }`}
                          onWheel={onTaskImagePreviewWheel}
                          onMouseDown={onTaskImagePreviewMouseDown}
                          onMouseMove={onTaskImagePreviewMouseMove}
                          onMouseUp={onTaskImagePreviewMouseUp}
                          onMouseLeave={onTaskImagePreviewMouseUp}
                        >
                          <img
                            src={taskFilePreviewOpenUrl}
                            alt={taskFilePreview.fileName}
                            style={{
                              transform: `translate(${taskImagePreviewPan.x}px, ${taskImagePreviewPan.y}px) scale(${taskImagePreviewZoom})`,
                              transformOrigin: "center center",
                            }}
                            className="max-h-full max-w-full select-none object-contain"
                          />
                        </div>
                      ) : selectedTaskModalPreviewType === "pdf" && taskFilePreviewOpenUrl ? (
                        <iframe
                          src={taskFilePreviewOpenUrl}
                          title={taskFilePreview.fileName}
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
                          {taskFilePreview.fileKey && !isDataUrl(taskFilePreview.fileKey) ? (
                            <p className="mt-1 max-w-full truncate text-xs text-foreground/60">
                              Referência: {taskFilePreview.fileKey}
                            </p>
                          ) : null}
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}
              </ModalBody>

              <ModalFooter>
                {taskFilePreview?.deleteAction.type === "draft-comment-file" ? (
                  <Button
                    type="button"
                    color="danger"
                    variant="flat"
                    onPress={deleteTaskPreviewFile}
                    startContent={<MaterialSymbol name="delete" className="text-[18px]" />}
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
        isOpen={isTaskFilePickerModalOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            closeTaskFilePicker();
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
                {taskFilePickerError ? (
                  <div className="rounded-xl border border-danger/30 bg-danger/10 p-3">
                    <p className="text-sm font-medium text-danger">{taskFilePickerError}</p>
                  </div>
                ) : null}

                <div
                  className={`rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors ${
                    isDraggingTaskFile
                      ? "border-primary bg-primary/5"
                      : "border-default-300 bg-default-50/30"
                  }`}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setIsDraggingTaskFile(true);
                  }}
                  onDragLeave={(event) => {
                    event.preventDefault();
                    setIsDraggingTaskFile(false);
                  }}
                  onDrop={onTaskFileDrop}
                >
                  <MaterialSymbol
                    name="upload_file"
                    className="mx-auto text-[36px] text-foreground/65"
                  />
                  <p className="mt-2 text-sm font-medium text-foreground">Solte o arquivo aqui</p>
                  <p className="text-xs text-foreground/65">
                    ou selecione um arquivo do dispositivo
                  </p>
                  <div className="mt-3">
                    <input
                      ref={taskFileInputRef}
                      type="file"
                      className="hidden"
                      onChange={onTaskFileInputChange}
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="flat"
                      onPress={() => taskFileInputRef.current?.click()}
                      startContent={<MaterialSymbol name="folder_open" className="text-[16px]" />}
                    >
                      Selecionar arquivo
                    </Button>
                  </div>
                </div>

                {selectedTaskLocalFile ? (
                  <div className="space-y-3 rounded-xl border border-default-200 p-3">
                    <p className="text-sm font-semibold text-foreground">Preview</p>

                    {selectedTaskPreviewType === "image" ? (
                      <div className="overflow-hidden rounded-lg border border-default-200">
                        <img
                          src={selectedTaskFilePreviewUrl}
                          alt={pendingTaskFile.fileName || "preview do arquivo"}
                          className="max-h-60 w-full object-contain"
                        />
                      </div>
                    ) : selectedTaskPreviewType === "pdf" ? (
                      <div className="overflow-hidden rounded-lg border border-default-200">
                        <iframe
                          src={selectedTaskFilePreviewUrl}
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
                  </div>
                ) : null}
              </ModalBody>

              <ModalFooter>
                <Button
                  variant="light"
                  onPress={() => {
                    closeModal();
                    closeTaskFilePicker();
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  color="primary"
                  onPress={confirmAddPickedTaskFile}
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

function authorLabel(comment: TaskComment): string {
  const name = (comment.authorName || "").trim();
  if (name) {
    return name;
  }

  const type = (comment.authorType || "").toLowerCase();
  if (type === "client") {
    return "Cliente";
  }

  return "Usuário";
}

function parseDateTime(value: string): number {
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return 0;
  }
  return parsedDate.getTime();
}

function orderTaskCommentsWithReplies(comments: TaskComment[]): TaskComment[] {
  if (comments.length <= 1) {
    return comments;
  }

  const commentsByID = new Map<string, TaskComment>();
  const childrenByParentID = new Map<string, TaskComment[]>();
  const rootComments: TaskComment[] = [];

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

  const orderedComments: TaskComment[] = [];
  const visitedCommentIDs = new Set<string>();

  const appendComment = (comment: TaskComment) => {
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

function getTaskCommentReplyDepth(
  comment: TaskComment,
  commentsByID: Map<string, TaskComment>,
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

function buildTaskBreadcrumb(item: PlanningItem, itemByID: Map<string, PlanningItem>): string {
  const trail: string[] = [];

  let currentParentID = (item.parentId || "").trim();
  while (currentParentID) {
    const parent = itemByID.get(currentParentID);
    if (!parent) {
      break;
    }

    trail.unshift(parent.title);
    currentParentID = (parent.parentId || "").trim();
  }

  if (trail.length === 0) {
    return "Sem fase/sub-fase";
  }

  return trail.join(" > ");
}

function kindLabel(kind: PlanningItem["kind"]): string {
  if (kind === "phase") {
    return "Fase";
  }
  if (kind === "subphase") {
    return "Sub-fase";
  }
  return "Tarefa";
}

function normalizeProjectStatus(value: string): string {
  const normalized = (value || "").trim().toLowerCase();
  if (
    normalized === "planejamento" ||
    normalized === "andamento" ||
    normalized === "concluido" ||
    normalized === "cancelado"
  ) {
    return normalized;
  }
  return "planejamento";
}

function projectStatusLabel(value: string): string {
  const normalized = normalizeProjectStatus(value);
  if (normalized === "andamento") {
    return "Em andamento";
  }
  if (normalized === "concluido") {
    return "Concluído";
  }
  if (normalized === "cancelado") {
    return "Cancelado";
  }
  return "Planejamento";
}

function truncate(value: string, maxLength: number): string {
  const normalized = (value || "").trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 1)}...`;
}

function formatDateTime(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }

  return parsed.toLocaleString("pt-BR");
}
