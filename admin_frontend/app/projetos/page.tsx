"use client";

import { Button } from "@heroui/button";
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@heroui/dropdown";
import { Input } from "@heroui/input";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/modal";
import { Tooltip } from "@heroui/tooltip";
import {
  ChangeEvent,
  ClipboardEvent,
  DragEvent,
  FormEvent,
  KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { loadSystemSettings } from "@/components/layout/system-settings";
import { MaterialSymbol } from "@/components/material-symbol";
import { adminBackendUrl } from "@/config/api";

type SubmenuKey = "projetos" | "tipos" | "receitas" | "cobrancas";

interface ApiError {
  error?: string;
}

interface ProjectListItem {
  id: string;
  name: string;
  objective: string;
  projectTypeId: string;
  projectTypeName: string;
  projectCategoryName: string;
  lifecycleType: string;
  hasMonthlyMaintenance: boolean;
  startDate?: string;
  endDate?: string;
  status: string;
  active: boolean;
  clientsCount: number;
  revenuesCount: number;
  monthlyChargesCount: number;
  phasesCount: number;
  tasksCount: number;
  created?: string;
  updated?: string;
}

interface ProjectCategory {
  id: string;
  code: string;
  name: string;
  description: string;
  active: boolean;
}

interface ProjectType {
  id: string;
  categoryId: string;
  categoryCode: string;
  categoryName: string;
  code: string;
  name: string;
  description: string;
  active: boolean;
}

interface ClientSummary {
  id: string;
  name: string;
  email: string;
  login: string;
}

interface UserSummary {
  id: string;
  name: string;
  email: string;
  login: string;
}

interface ProjectRelatedFile {
  id: string;
  fileName: string;
  fileKey: string;
  contentType: string;
  notes: string;
}

interface ProjectPhase {
  id: string;
  projectId: string;
  name: string;
  description: string;
  objective: string;
  startsOn?: string;
  endsOn?: string;
  position: number;
  active: boolean;
  files: ProjectRelatedFile[];
}

interface ProjectTask {
  id: string;
  projectId: string;
  projectPhaseId: string;
  responsibleUserId?: string;
  responsibleUserName?: string;
  name: string;
  description: string;
  objective: string;
  startsOn?: string;
  endsOn?: string;
  position: number;
  status: string;
  active: boolean;
  files: ProjectRelatedFile[];
}

interface ProjectRevenueReceipt {
  id: string;
  projectRevenueId: string;
  fileName: string;
  fileKey: string;
  contentType: string;
  issuedOn?: string;
  notes: string;
}

interface ProjectRevenue {
  id: string;
  projectId: string;
  title: string;
  description: string;
  objective: string;
  amount: number;
  expectedOn?: string;
  receivedOn?: string;
  status: string;
  active: boolean;
  receipts: ProjectRevenueReceipt[];
}

interface ProjectMonthlyCharge {
  id: string;
  projectId: string;
  title: string;
  description: string;
  installment: string;
  status: string;
  amount: number;
  dueDay: number;
  startsOn?: string;
  endsOn?: string;
  active: boolean;
}

interface ProjectClient {
  clientId: string;
  name: string;
  email: string;
  login: string;
  role: string;
}

interface ProjectManager {
  userId: string;
  name: string;
  email: string;
  login: string;
}

interface ProjectDetail {
  id: string;
  name: string;
  objective: string;
  projectTypeId: string;
  projectTypeName: string;
  projectCategoryName: string;
  lifecycleType: string;
  hasMonthlyMaintenance: boolean;
  startDate?: string;
  endDate?: string;
  status: string;
  active: boolean;
  clients: ProjectClient[];
  managers: ProjectManager[];
  revenues: ProjectRevenue[];
  monthlyCharges: ProjectMonthlyCharge[];
  phases: ProjectPhase[];
  tasks: ProjectTask[];
}

interface ProjectExportSummary {
  projectPercent: number;
  totalPhases: number;
  totalTasks: number;
  totalTrackedTasks: number;
  totalCompletedTasks: number;
}

interface ProjectExportPlanningItem {
  id: string;
  parentId?: string;
  level: number;
  kind: "phase" | "subphase" | "task";
  phaseId?: string;
  title: string;
  description: string;
  startsOn?: string;
  endsOn?: string;
  status: string;
  progressPercent: number;
  position: number;
  files: ProjectRelatedFile[];
}

interface ProjectExportPayload {
  project: ProjectDetail;
  summary: ProjectExportSummary;
  planning: ProjectExportPlanningItem[];
  generatedAt?: string;
}

interface ProjectFormData {
  name: string;
  objective: string;
  projectTypeId: string;
  lifecycleType: "temporario" | "recorrente";
  hasMonthlyMaintenance: boolean;
  startDate: string;
  endDate: string;
  active: boolean;
  clientIds: string[];
  managerUserIds: string[];
}

interface ProjectTypeFormData {
  categoryId: string;
  code: string;
  name: string;
  description: string;
  active: boolean;
}

interface RevenueReceiptFormData {
  fileName: string;
  fileKey: string;
  contentType: string;
  issuedOn: string;
  notes: string;
}

interface RevenueFormData {
  projectId: string;
  title: string;
  description: string;
  objective: string;
  amount: string;
  expectedOn: string;
  receivedOn: string;
  active: boolean;
  receipts: RevenueReceiptFormData[];
}

interface ChargeFormData {
  projectId: string;
  title: string;
  description: string;
  installment: string;
  status: string;
  amount: string;
  dueDay: string;
  startsOn: string;
  endsOn: string;
  active: boolean;
}

interface PhaseFormData {
  name: string;
  description: string;
  startsOn: string;
  endsOn: string;
}

interface SubPhaseFormData {
  name: string;
  description: string;
  startsOn: string;
  endsOn: string;
}

interface TaskFormData {
  name: string;
  description: string;
  startsOn: string;
  endsOn: string;
  status: string;
  responsibleUserId: string;
}

interface ProjectTaskComment {
  id: string;
  projectTaskId: string;
  parentCommentId?: string;
  userId?: string;
  clientId?: string;
  userName?: string;
  authorName?: string;
  authorType?: string;
  isProjectManager?: boolean;
  isTaskResponsible?: boolean;
  comment: string;
  files: ProjectRelatedFile[];
  created?: string;
  updated?: string;
}

interface TaskCommentFormData {
  comment: string;
  parentCommentId: string;
  files: RevenueReceiptFormData[];
}

interface TaskModalContext {
  phase: ProjectPhase;
  subPhase: ProjectTask | null;
}

interface TaskCommentModalContext {
  phase: ProjectPhase;
  subPhase: ProjectTask | null;
  task: ProjectTask;
}

type ProjectStatusActionType = "concluido" | "cancelado";

interface ProjectStatusModalContext {
  project: ProjectListItem;
  nextStatus: ProjectStatusActionType;
}

type PlannerTaskMeta =
  | {
      kind: "subphase";
    }
  | {
      kind: "task";
      parentType: "phase" | "subphase" | "task";
      parentId?: string;
    };

interface PlanningRow {
  key: string;
  level: number;
  kind: "phase" | "subphase" | "task";
  iconLabel: "F" | "S" | "T";
  iconClassName: string;
  title: string;
  description: string;
  breadcrumb: string;
  startsOn?: string;
  endsOn?: string;
  progressPercent: number;
  phaseRef: ProjectPhase;
  subPhaseRef: ProjectTask | null;
  taskRef: ProjectTask | null;
}

interface PlanningProgressSummary {
  projectPercent: number;
  phasePercentByID: Record<string, number>;
  taskPercentByID: Record<string, number>;
}

interface FlattenedTaskComment {
  comment: ProjectTaskComment;
  depth: number;
}

const submenuItems: Array<{ key: SubmenuKey; label: string; icon: string }> = [
  { key: "projetos", label: "Projetos", icon: "workspaces" },
  { key: "receitas", label: "Receitas", icon: "payments" },
  { key: "cobrancas", label: "Cobranças", icon: "receipt_long" },
  { key: "tipos", label: "Tipos", icon: "category" },
];

const taskStatusOptions: Array<{ value: string; label: string }> = [
  { value: "planejada", label: "Planejada" },
  { value: "iniciada", label: "Iniciada" },
  { value: "concluida", label: "Concluída" },
  { value: "cancelada", label: "Cancelada" },
];

const wideModalClassNames = {
  base: "min-w-[80vw]",
} as const;

const projectModalClassNames = {
  base: "min-w-[90vw] sm:min-w-[40vw] sm:max-w-[40vw]",
} as const;

const projectTypeModalClassNames = {
  base: "min-w-[56vw]",
} as const;

const revenueModalClassNames = {
  base: "min-w-[36vw] max-h-[90vh]",
} as const;

const chargeModalClassNames = {
  base: "min-w-[39.2vw]",
} as const;

const phaseModalClassNames = {
  base: "min-w-[90vw] sm:min-w-[60vw] sm:max-w-[60vw] lg:min-w-[40vw] lg:max-w-[40vw]",
} as const;

const veryWideTaskModalClassNames = {
  base: "min-w-[50vw] max-w-[56vw]",
} as const;

const taskCreateModalClassNames = {
  base: "min-w-[90vw] sm:min-w-[40vw] sm:max-w-[40vw]",
} as const;

function createEmptyProjectForm(): ProjectFormData {
  return {
    name: "",
    objective: "",
    projectTypeId: "",
    lifecycleType: "temporario",
    hasMonthlyMaintenance: false,
    startDate: "",
    endDate: "",
    active: true,
    clientIds: [],
    managerUserIds: [],
  };
}

function createEmptyProjectTypeForm(): ProjectTypeFormData {
  return {
    categoryId: "",
    code: "",
    name: "",
    description: "",
    active: true,
  };
}

function createEmptyRevenueForm(projectId: string): RevenueFormData {
  return {
    projectId,
    title: "",
    description: "",
    objective: "",
    amount: "",
    expectedOn: "",
    receivedOn: "",
    active: true,
    receipts: [],
  };
}

function createEmptyChargeForm(projectId: string): ChargeFormData {
  return {
    projectId,
    title: "",
    description: "",
    installment: "",
    status: "pendente",
    amount: "",
    dueDay: "1",
    startsOn: "",
    endsOn: "",
    active: true,
  };
}

function createEmptyPhaseForm(): PhaseFormData {
  return {
    name: "",
    description: "",
    startsOn: "",
    endsOn: "",
  };
}

function createEmptySubPhaseForm(): SubPhaseFormData {
  return {
    name: "",
    description: "",
    startsOn: "",
    endsOn: "",
  };
}

function createEmptyTaskForm(): TaskFormData {
  return {
    name: "",
    description: "",
    startsOn: "",
    endsOn: "",
    status: "planejada",
    responsibleUserId: "",
  };
}

function createEmptyTaskCommentForm(): TaskCommentFormData {
  return {
    comment: "",
    parentCommentId: "",
    files: [],
  };
}

function extractFileNameFromContentDisposition(headerValue: string | null): string | null {
  if (!headerValue) {
    return null;
  }

  const utf8Match = headerValue.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1]).replace(/^["']|["']$/g, "");
    } catch {
      return utf8Match[1].replace(/^["']|["']$/g, "");
    }
  }

  const filenameMatch = headerValue.match(/filename="?([^";]+)"?/i);
  if (filenameMatch?.[1]) {
    return filenameMatch[1].trim();
  }

  return null;
}

function isRevenueReceiptImage(receipt: ProjectRevenueReceipt): boolean {
  const normalizedContentType = (receipt.contentType || "").trim().toLowerCase();
  if (normalizedContentType.startsWith("image/")) {
    return true;
  }

  const source = `${receipt.fileName || ""} ${receipt.fileKey || ""}`.toLowerCase();
  return [".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp", ".svg", ".avif"].some((extension) =>
    source.includes(extension),
  );
}

export default function ProjetosPage() {
  const [activeMenu, setActiveMenu] = useState<SubmenuKey>("projetos");

  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [projectCategories, setProjectCategories] = useState<ProjectCategory[]>([]);
  const [projectTypes, setProjectTypes] = useState<ProjectType[]>([]);
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [users, setUsers] = useState<UserSummary[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchValue, setSearchValue] = useState("");

  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [projectForm, setProjectForm] = useState<ProjectFormData>(createEmptyProjectForm());
  const [projectFormError, setProjectFormError] = useState<string | null>(null);
  const [editingProjectID, setEditingProjectID] = useState<string | null>(null);
  const [isLoadingProjectModal, setIsLoadingProjectModal] = useState(false);
  const [isSavingProject, setIsSavingProject] = useState(false);
  const [projectManagerSearchValue, setProjectManagerSearchValue] = useState("");
  const [isProjectStatusModalOpen, setIsProjectStatusModalOpen] = useState(false);
  const [projectStatusModalContext, setProjectStatusModalContext] =
    useState<ProjectStatusModalContext | null>(null);
  const [projectStatusModalError, setProjectStatusModalError] = useState<string | null>(null);
  const [isUpdatingProjectStatus, setIsUpdatingProjectStatus] = useState(false);

  const [isProjectTypeModalOpen, setIsProjectTypeModalOpen] = useState(false);
  const [projectTypeForm, setProjectTypeForm] = useState<ProjectTypeFormData>(
    createEmptyProjectTypeForm(),
  );
  const [projectTypeFormError, setProjectTypeFormError] = useState<string | null>(null);
  const [isSavingProjectType, setIsSavingProjectType] = useState(false);
  const [updatingProjectTypeID, setUpdatingProjectTypeID] = useState<string | null>(null);

  const [selectedRevenueProjectId, setSelectedRevenueProjectId] = useState("");
  const [revenueProjectSearchValue, setRevenueProjectSearchValue] = useState("");
  const [isRevenueProjectSearchOpen, setIsRevenueProjectSearchOpen] = useState(false);
  const [revenues, setRevenues] = useState<ProjectRevenue[]>([]);
  const [isLoadingRevenues, setIsLoadingRevenues] = useState(false);

  const [isRevenueModalOpen, setIsRevenueModalOpen] = useState(false);
  const [revenueForm, setRevenueForm] = useState<RevenueFormData>(createEmptyRevenueForm(""));
  const [revenueFormError, setRevenueFormError] = useState<string | null>(null);
  const [isSavingRevenue, setIsSavingRevenue] = useState(false);
  const [isRevenueCancelModalOpen, setIsRevenueCancelModalOpen] = useState(false);
  const [revenueToCancel, setRevenueToCancel] = useState<ProjectRevenue | null>(null);
  const [revenueCancelError, setRevenueCancelError] = useState<string | null>(null);
  const [isCancellingRevenue, setIsCancellingRevenue] = useState(false);
  const [isRevenueReceiptModalOpen, setIsRevenueReceiptModalOpen] = useState(false);
  const [selectedRevenueReceipt, setSelectedRevenueReceipt] =
    useState<ProjectRevenueReceipt | null>(null);
  const revenueReceiptFileInputRef = useRef<HTMLInputElement | null>(null);

  const [selectedChargeProjectId, setSelectedChargeProjectId] = useState("");
  const [chargeProjectSearchValue, setChargeProjectSearchValue] = useState("");
  const [isChargeProjectSearchOpen, setIsChargeProjectSearchOpen] = useState(false);
  const [monthlyCharges, setMonthlyCharges] = useState<ProjectMonthlyCharge[]>([]);
  const [isLoadingCharges, setIsLoadingCharges] = useState(false);

  const [isChargeModalOpen, setIsChargeModalOpen] = useState(false);
  const [chargeForm, setChargeForm] = useState<ChargeFormData>(createEmptyChargeForm(""));
  const [chargeFormError, setChargeFormError] = useState<string | null>(null);
  const [isSavingCharge, setIsSavingCharge] = useState(false);
  const [editingChargeID, setEditingChargeID] = useState<string | null>(null);
  const [updatingChargeStatusID, setUpdatingChargeStatusID] = useState<string | null>(null);
  const [chargeActionsError, setChargeActionsError] = useState<string | null>(null);
  const [isChargeAmountModalOpen, setIsChargeAmountModalOpen] = useState(false);
  const [editingCharge, setEditingCharge] = useState<ProjectMonthlyCharge | null>(null);
  const [chargeAmountFormValue, setChargeAmountFormValue] = useState("");
  const [chargeAmountFormError, setChargeAmountFormError] = useState<string | null>(null);
  const [isSavingChargeAmount, setIsSavingChargeAmount] = useState(false);
  const [isChargeDeleteModalOpen, setIsChargeDeleteModalOpen] = useState(false);
  const [chargeToDelete, setChargeToDelete] = useState<ProjectMonthlyCharge | null>(null);
  const [chargeDeleteError, setChargeDeleteError] = useState<string | null>(null);
  const [isDeletingCharge, setIsDeletingCharge] = useState(false);

  const [isRoadmapModalOpen, setIsRoadmapModalOpen] = useState(false);
  const [isPhaseModalOpen, setIsPhaseModalOpen] = useState(false);
  const [isSubPhaseModalOpen, setIsSubPhaseModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [roadmapProject, setRoadmapProject] = useState<ProjectDetail | null>(null);
  const [isLoadingRoadmap, setIsLoadingRoadmap] = useState(false);
  const [isRefreshingRoadmap, setIsRefreshingRoadmap] = useState(false);
  const [isRecalculatingRoadmap, setIsRecalculatingRoadmap] = useState(false);
  const [isExportingRoadmapPdf, setIsExportingRoadmapPdf] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportModalError, setExportModalError] = useState<string | null>(null);
  const [exportPdfURL, setExportPdfURL] = useState<string | null>(null);
  const [exportPdfFileName, setExportPdfFileName] = useState("projeto.pdf");
  const [roadmapError, setRoadmapError] = useState<string | null>(null);

  const [phaseForm, setPhaseForm] = useState<PhaseFormData>(createEmptyPhaseForm());
  const [phaseFormError, setPhaseFormError] = useState<string | null>(null);
  const [isSavingPhase, setIsSavingPhase] = useState(false);

  const [subPhaseForm, setSubPhaseForm] = useState<SubPhaseFormData>(createEmptySubPhaseForm());
  const [subPhaseFormError, setSubPhaseFormError] = useState<string | null>(null);
  const [isSavingSubPhase, setIsSavingSubPhase] = useState(false);
  const [selectedPhaseForSubPhase, setSelectedPhaseForSubPhase] = useState<ProjectPhase | null>(
    null,
  );

  const [taskForm, setTaskForm] = useState<TaskFormData>(createEmptyTaskForm());
  const [taskFormError, setTaskFormError] = useState<string | null>(null);
  const [isSavingTask, setIsSavingTask] = useState(false);
  const [taskModalContext, setTaskModalContext] = useState<TaskModalContext | null>(null);
  const [editingPhase, setEditingPhase] = useState<ProjectPhase | null>(null);
  const [editingSubPhase, setEditingSubPhase] = useState<ProjectTask | null>(null);
  const [editingTask, setEditingTask] = useState<ProjectTask | null>(null);
  const [isTaskCommentsModalOpen, setIsTaskCommentsModalOpen] = useState(false);
  const [taskCommentModalContext, setTaskCommentModalContext] =
    useState<TaskCommentModalContext | null>(null);
  const [taskComments, setTaskComments] = useState<ProjectTaskComment[]>([]);
  const [isLoadingTaskComments, setIsLoadingTaskComments] = useState(false);
  const [taskCommentsError, setTaskCommentsError] = useState<string | null>(null);
  const [taskCommentForm, setTaskCommentForm] = useState<TaskCommentFormData>(
    createEmptyTaskCommentForm(),
  );
  const [taskCommentFormError, setTaskCommentFormError] = useState<string | null>(null);
  const [isSavingTaskComment, setIsSavingTaskComment] = useState(false);
  const taskCommentFileInputRef = useRef<HTMLInputElement | null>(null);
  const taskCommentTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  const filteredProjects = useMemo(
    () => filterProjectsBySearch(projects, searchValue),
    [projects, searchValue],
  );
  const filteredProjectManagerUsers = useMemo(
    () => filterUsersBySearch(users, projectManagerSearchValue),
    [users, projectManagerSearchValue],
  );

  const selectedRevenueProject = useMemo(
    () => projects.find((project) => project.id === selectedRevenueProjectId) || null,
    [projects, selectedRevenueProjectId],
  );

  const selectedChargeProject = useMemo(
    () => projects.find((project) => project.id === selectedChargeProjectId) || null,
    [projects, selectedChargeProjectId],
  );

  const revenueProjectSearchResults = useMemo(
    () => filterProjectsBySearch(projects, revenueProjectSearchValue),
    [projects, revenueProjectSearchValue],
  );

  const chargeProjectSearchResults = useMemo(
    () => filterProjectsBySearch(projects, chargeProjectSearchValue),
    [projects, chargeProjectSearchValue],
  );

  const planningProgress = useMemo(
    () => calculatePlanningProgress(roadmapProject),
    [roadmapProject],
  );
  const planningRows = useMemo(
    () => buildPlanningRows(roadmapProject, planningProgress),
    [planningProgress, roadmapProject],
  );
  const flattenedTaskComments = useMemo(
    () => flattenTaskComments(taskComments),
    [taskComments],
  );
  const replyTargetComment = useMemo(
    () => taskComments.find((comment) => comment.id === taskCommentForm.parentCommentId) || null,
    [taskComments, taskCommentForm.parentCommentId],
  );

  const resetExportPdfPreview = () => {
    if (exportPdfURL) {
      URL.revokeObjectURL(exportPdfURL);
    }
    setExportPdfURL(null);
    setExportPdfFileName("projeto.pdf");
  };

  useEffect(() => {
    return () => {
      if (exportPdfURL) {
        URL.revokeObjectURL(exportPdfURL);
      }
    };
  }, [exportPdfURL]);

  useEffect(() => {
    void loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedRevenueProjectId) {
      setRevenues([]);
      return;
    }

    void loadProjectRevenues(selectedRevenueProjectId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRevenueProjectId]);

  useEffect(() => {
    if (!selectedChargeProjectId) {
      setMonthlyCharges([]);
      return;
    }

    void loadProjectMonthlyCharges(selectedChargeProjectId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChargeProjectId]);

  useEffect(() => {
    if (!selectedRevenueProjectId) {
      setRevenueProjectSearchValue("");
      return;
    }

    const selectedProject = projects.find((project) => project.id === selectedRevenueProjectId);
    setRevenueProjectSearchValue(selectedProject?.name || "");
  }, [projects, selectedRevenueProjectId]);

  useEffect(() => {
    if (!selectedChargeProjectId) {
      setChargeProjectSearchValue("");
      return;
    }

    const selectedProject = projects.find((project) => project.id === selectedChargeProjectId);
    setChargeProjectSearchValue(selectedProject?.name || "");
  }, [projects, selectedChargeProjectId]);

  const loadInitialData = async () => {
    const token = readTokenFromCookie();
    if (!token) {
      setError("Sessão inválida. Faça login novamente.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [projectsData] = await Promise.all([
        loadProjects(token),
        loadProjectTypesAndCategories(token),
        loadClients(token),
        loadUsers(token),
      ]);

      const firstProjectId = projectsData[0]?.id || "";
      setSelectedRevenueProjectId((current) => current || firstProjectId);
      setSelectedChargeProjectId((current) => current || firstProjectId);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Falha de conexão com a API.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const loadProjects = async (token: string): Promise<ProjectListItem[]> => {
    const response = await fetch(`${adminBackendUrl}/projects`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const payload = (await response.json()) as ProjectListItem[] | ApiError;
    if (!response.ok) {
      throw new Error(getApiErrorMessage(payload, "Não foi possível carregar os projetos."));
    }

    const projectsData = Array.isArray(payload) ? payload : [];
    setProjects(projectsData);
    return projectsData;
  };

  const loadProjectTypesAndCategories = async (token: string) => {
    const [categoriesResponse, typesResponse] = await Promise.all([
      fetch(`${adminBackendUrl}/project-categories`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
      fetch(`${adminBackendUrl}/project-types`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
    ]);

    const categoriesPayload = (await categoriesResponse.json()) as
      | ProjectCategory[]
      | ApiError;
    if (!categoriesResponse.ok) {
      throw new Error(
        getApiErrorMessage(
          categoriesPayload,
          "Não foi possível carregar categorias de projeto.",
        ),
      );
    }

    const typesPayload = (await typesResponse.json()) as ProjectType[] | ApiError;
    if (!typesResponse.ok) {
      throw new Error(
        getApiErrorMessage(typesPayload, "Não foi possível carregar tipos de projeto."),
      );
    }

    const categoriesData = Array.isArray(categoriesPayload) ? categoriesPayload : [];
    const typesData = Array.isArray(typesPayload) ? typesPayload : [];

    setProjectCategories(categoriesData);
    setProjectTypes(typesData);

    setProjectTypeForm((currentForm) => ({
      ...currentForm,
      categoryId: currentForm.categoryId || categoriesData[0]?.id || "",
    }));
  };

  const loadClients = async (token: string) => {
    const response = await fetch(`${adminBackendUrl}/clients/active`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const payload = (await response.json()) as ClientSummary[] | ApiError;
    if (!response.ok) {
      throw new Error(getApiErrorMessage(payload, "Não foi possível carregar clientes."));
    }

    const clientsData = Array.isArray(payload) ? payload : [];
    setClients(clientsData);
  };

  const loadUsers = async (token: string) => {
    const response = await fetch(`${adminBackendUrl}/users/active`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const payload = (await response.json()) as UserSummary[] | ApiError;
    if (!response.ok) {
      throw new Error(getApiErrorMessage(payload, "Não foi possível carregar usuários."));
    }

    const usersData = Array.isArray(payload) ? payload : [];
    setUsers(usersData);
  };

  const loadProjectRevenues = async (projectId: string) => {
    const token = readTokenFromCookie();
    if (!token) {
      return;
    }

    setIsLoadingRevenues(true);
    try {
      const response = await fetch(`${adminBackendUrl}/projects/${projectId}/revenues`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const payload = (await response.json()) as ProjectRevenue[] | ApiError;
      if (!response.ok) {
        setError(getApiErrorMessage(payload, "Não foi possível carregar receitas."));
        return;
      }

      setRevenues(Array.isArray(payload) ? payload : []);
    } catch {
      setError("Falha de conexão com a API.");
    } finally {
      setIsLoadingRevenues(false);
    }
  };

  const loadProjectMonthlyCharges = async (projectId: string) => {
    const token = readTokenFromCookie();
    if (!token) {
      return;
    }

    setIsLoadingCharges(true);
    try {
      const response = await fetch(
        `${adminBackendUrl}/projects/${projectId}/monthly-charges`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const payload = (await response.json()) as ProjectMonthlyCharge[] | ApiError;
      if (!response.ok) {
        setError(getApiErrorMessage(payload, "Não foi possível carregar cobranças."));
        return;
      }

      setMonthlyCharges(Array.isArray(payload) ? payload : []);
    } catch {
      setError("Falha de conexão com a API.");
    } finally {
      setIsLoadingCharges(false);
    }
  };

  const loadProjectDetail = async (projectId: string): Promise<ProjectDetail | null> => {
    const token = readTokenFromCookie();
    if (!token) {
      return null;
    }

    setIsLoadingRoadmap(true);
    setRoadmapError(null);

    try {
      const response = await fetch(`${adminBackendUrl}/projects/${projectId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const payload = (await response.json()) as ProjectDetail | ApiError;
      if (!response.ok) {
        setRoadmapError(
          getApiErrorMessage(payload, "Não foi possível carregar os dados do projeto."),
        );
        return null;
      }

      if (Array.isArray(payload) || !("id" in payload)) {
        setRoadmapError("Resposta inválida da API.");
        return null;
      }

      setRoadmapProject(payload);

      return payload;
    } catch {
      setRoadmapError("Falha de conexão com a API.");
      return null;
    } finally {
      setIsLoadingRoadmap(false);
    }
  };

  const handleRefreshRoadmap = async () => {
    if (!roadmapProject) {
      return;
    }

    setIsRefreshingRoadmap(true);
    try {
      await loadProjectDetail(roadmapProject.id);
    } finally {
      setIsRefreshingRoadmap(false);
    }
  };

  const handleRecalculateProjectTimeline = async () => {
    if (!roadmapProject) {
      return;
    }

    const token = readTokenFromCookie();
    if (!token) {
      setRoadmapError("Sessão inválida. Faça login novamente.");
      return;
    }

    const projectId = roadmapProject.id;
    setIsRecalculatingRoadmap(true);
    setRoadmapError(null);

    try {
      const response = await fetch(`${adminBackendUrl}/projects/${projectId}/recalculate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const payload = (await response.json()) as ProjectDetail | ApiError;
      if (!response.ok) {
        setRoadmapError(
          getApiErrorMessage(payload, "Não foi possível recalcular o cronograma do projeto."),
        );
        return;
      }

      if (Array.isArray(payload) || !("id" in payload)) {
        await loadProjectDetail(projectId);
      } else {
        setRoadmapProject(payload);
      }

      await loadInitialData();
    } catch {
      setRoadmapError("Falha de conexão com a API.");
    } finally {
      setIsRecalculatingRoadmap(false);
    }
  };

  const handleExportRoadmapPdf = async () => {
    if (!roadmapProject) {
      return;
    }

    const token = readTokenFromCookie();
    if (!token) {
      setExportModalError("Sessão inválida. Faça login novamente.");
      return;
    }

    setIsExportingRoadmapPdf(true);
    setExportModalError(null);
    setIsExportModalOpen(true);
    resetExportPdfPreview();

    try {
      const systemSettings = loadSystemSettings("light");
      const queryParams = new URLSearchParams({
        theme: systemSettings.theme,
        font: systemSettings.font,
      });

      const response = await fetch(
        `${adminBackendUrl}/projects/${roadmapProject.id}/export-pdf?${queryParams.toString()}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        const contentType = response.headers.get("content-type") || "";
        let payload: ApiError | undefined;
        if (contentType.includes("application/json")) {
          try {
            payload = (await response.json()) as ApiError;
          } catch {
            payload = undefined;
          }
        }
        setExportModalError(
          getApiErrorMessage(payload, "Não foi possível exportar o projeto em PDF."),
        );
        return;
      }

      const pdfBlob = await response.blob();
      if (!pdfBlob.size) {
        setExportModalError("O backend não retornou conteúdo para o PDF.");
        return;
      }

      const blobURL = URL.createObjectURL(pdfBlob);
      setExportPdfURL(blobURL);

      const headerFileName = extractFileNameFromContentDisposition(
        response.headers.get("content-disposition"),
      );
      if (headerFileName) {
        setExportPdfFileName(headerFileName);
      } else {
        setExportPdfFileName(`projeto-${roadmapProject.id}.pdf`);
      }
    } catch {
      setExportModalError("Falha de conexão com a API.");
    } finally {
      setIsExportingRoadmapPdf(false);
    }
  };

  const handleDownloadExportPdf = () => {
    if (!exportPdfURL) {
      return;
    }

    const link = document.createElement("a");
    link.href = exportPdfURL;
    link.download = exportPdfFileName || "projeto.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCloseExportModal = () => {
    setIsExportModalOpen(false);
    setExportModalError(null);
    setIsExportingRoadmapPdf(false);
    resetExportPdfPreview();
  };

  const openExportModalAndGeneratePdf = () => {
    void handleExportRoadmapPdf();
  };

  const openProjectModal = () => {
    setEditingProjectID(null);
    setProjectForm(createEmptyProjectForm());
    setProjectFormError(null);
    setProjectManagerSearchValue("");
    setIsProjectModalOpen(true);
  };

  const openProjectEditModal = async (projectID: string) => {
    const token = readTokenFromCookie();
    if (!token) {
      setError("Sessão inválida. Faça login novamente.");
      return;
    }

    const listedProject = projects.find((project) => project.id === projectID) || null;

    setEditingProjectID(null);
    setProjectForm({
      ...createEmptyProjectForm(),
      name: listedProject?.name || "",
      objective: listedProject?.objective || "",
    });
    setIsLoadingProjectModal(true);
    setProjectFormError(null);
    setIsProjectModalOpen(true);
    try {
      const response = await fetch(`${adminBackendUrl}/projects/${projectID}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const payload = (await response.json()) as ProjectDetail | ApiError;
      if (!response.ok) {
        setProjectFormError(
          getApiErrorMessage(payload, "Não foi possível carregar o projeto."),
        );
        return;
      }

      if (Array.isArray(payload) || !("id" in payload)) {
        setProjectFormError("Resposta inválida da API.");
        return;
      }

      setEditingProjectID(payload.id);
      setProjectForm({
        name: payload.name || "",
        objective: payload.objective || listedProject?.objective || "",
        projectTypeId: payload.projectTypeId || "",
        lifecycleType:
          payload.lifecycleType === "recorrente" ? "recorrente" : "temporario",
        hasMonthlyMaintenance: Boolean(payload.hasMonthlyMaintenance),
        startDate: toDateInputValue(payload.startDate),
        endDate: toDateInputValue(payload.endDate),
        active: Boolean(payload.active),
        clientIds: payload.clients.map((client) => client.clientId),
        managerUserIds: (payload.managers || []).map((manager) => manager.userId),
      });
      setProjectManagerSearchValue("");
      setIsProjectModalOpen(true);
    } catch {
      setProjectFormError("Falha de conexão com a API.");
    } finally {
      setIsLoadingProjectModal(false);
    }
  };

  const handleDeleteProject = async (project: ProjectListItem) => {
    const shouldDelete = window.confirm(
      `Deseja excluir o projeto \"${project.name}\"?`,
    );
    if (!shouldDelete) {
      return;
    }

    const token = readTokenFromCookie();
    if (!token) {
      setError("Sessão inválida. Faça login novamente.");
      return;
    }

    setError(null);

    try {
      const response = await fetch(`${adminBackendUrl}/projects/${project.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        let payload: ApiError | undefined;
        try {
          payload = (await response.json()) as ApiError;
        } catch {
          payload = undefined;
        }
        setError(
          getApiErrorMessage(payload, "Não foi possível excluir o projeto."),
        );
        return;
      }

      if (selectedRevenueProjectId === project.id) {
        setSelectedRevenueProjectId("");
      }
      if (selectedChargeProjectId === project.id) {
        setSelectedChargeProjectId("");
      }
      if (roadmapProject?.id === project.id) {
        setIsRoadmapModalOpen(false);
        setRoadmapProject(null);
      }
      if (editingProjectID === project.id) {
        setIsProjectModalOpen(false);
        setEditingProjectID(null);
      }

      await loadInitialData();
    } catch {
      setError("Falha de conexão com a API.");
    }
  };

  const openProjectStatusModal = (
    project: ProjectListItem,
    nextStatus: ProjectStatusActionType,
  ) => {
    const currentStatus = normalizeProjectStatusValue(project.status, project.active);
    if (currentStatus === nextStatus) {
      return;
    }

    setProjectStatusModalError(null);
    setProjectStatusModalContext({ project, nextStatus });
    setIsProjectStatusModalOpen(true);
  };

  const closeProjectStatusModal = () => {
    setIsProjectStatusModalOpen(false);
    setProjectStatusModalContext(null);
    setProjectStatusModalError(null);
  };

  const handleUpdateProjectStatus = async () => {
    if (!projectStatusModalContext) {
      return;
    }

    const { project, nextStatus } = projectStatusModalContext;

    const token = readTokenFromCookie();
    if (!token) {
      setProjectStatusModalError("Sessão inválida. Faça login novamente.");
      return;
    }

    setError(null);
    setProjectStatusModalError(null);
    setIsUpdatingProjectStatus(true);

    try {
      const response = await fetch(`${adminBackendUrl}/projects/${project.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: nextStatus,
        }),
      });

      const payload = (await response.json()) as ProjectDetail | ApiError;
      if (!response.ok) {
        setProjectStatusModalError(
          getApiErrorMessage(payload, "Não foi possível atualizar o status do projeto."),
        );
        return;
      }

      if (roadmapProject?.id === project.id) {
        await loadProjectDetail(project.id);
      }

      await loadInitialData();
      closeProjectStatusModal();
    } catch {
      setProjectStatusModalError("Falha de conexão com a API.");
    } finally {
      setIsUpdatingProjectStatus(false);
    }
  };

  const openProjectTypeModal = () => {
    setProjectTypeForm({
      ...createEmptyProjectTypeForm(),
      categoryId: projectCategories[0]?.id || "",
    });
    setProjectTypeFormError(null);
    setIsProjectTypeModalOpen(true);
  };

  const handleDeactivateProjectType = async (projectType: ProjectType) => {
    if (!projectType.active) {
      return;
    }

    const shouldDeactivate = window.confirm(
      `Deseja desativar o tipo de projeto "${projectType.name}"?`,
    );
    if (!shouldDeactivate) {
      return;
    }

    const token = readTokenFromCookie();
    if (!token) {
      setError("Sessão inválida. Faça login novamente.");
      return;
    }

    setError(null);
    setUpdatingProjectTypeID(projectType.id);

    try {
      const response = await fetch(`${adminBackendUrl}/project-types/${projectType.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          categoryId: projectType.categoryId,
          code: projectType.code,
          name: projectType.name,
          description: projectType.description,
          active: false,
        }),
      });

      const payload = (await response.json()) as ProjectType | ApiError;
      if (!response.ok) {
        setError(getApiErrorMessage(payload, "Não foi possível desativar o tipo de projeto."));
        return;
      }

      await loadProjectTypesAndCategories(token);
    } catch {
      setError("Falha de conexão com a API.");
    } finally {
      setUpdatingProjectTypeID(null);
    }
  };

  const openRevenueModal = () => {
    setRevenueForm(createEmptyRevenueForm(selectedRevenueProjectId));
    setRevenueFormError(null);
    setIsRevenueModalOpen(true);
  };

  const selectRevenueProject = (project: ProjectListItem) => {
    setSelectedRevenueProjectId(project.id);
    setRevenueProjectSearchValue(project.name);
    setIsRevenueProjectSearchOpen(false);
  };

  const handleRevenueProjectSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const firstMatch = revenueProjectSearchResults[0];
    if (!firstMatch) {
      return;
    }

    selectRevenueProject(firstMatch);
  };

  const selectChargeProject = (project: ProjectListItem) => {
    setSelectedChargeProjectId(project.id);
    setChargeProjectSearchValue(project.name);
    setIsChargeProjectSearchOpen(false);
  };

  const handleChargeProjectSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const firstMatch = chargeProjectSearchResults[0];
    if (!firstMatch) {
      return;
    }

    selectChargeProject(firstMatch);
  };

  const openRevenueCancelModal = (revenue: ProjectRevenue) => {
    setRevenueToCancel(revenue);
    setRevenueCancelError(null);
    setIsRevenueCancelModalOpen(true);
  };

  const closeRevenueCancelModal = () => {
    setIsRevenueCancelModalOpen(false);
    setRevenueToCancel(null);
    setRevenueCancelError(null);
  };

  const openRevenueReceiptModal = (receipt: ProjectRevenueReceipt) => {
    setSelectedRevenueReceipt(receipt);
    setIsRevenueReceiptModalOpen(true);
  };

  const closeRevenueReceiptModal = () => {
    setIsRevenueReceiptModalOpen(false);
    setSelectedRevenueReceipt(null);
  };

  const handleCancelRevenue = async () => {
    if (!revenueToCancel) {
      return;
    }

    const token = readTokenFromCookie();
    if (!token) {
      setRevenueCancelError("Sessão inválida. Faça login novamente.");
      return;
    }

    setRevenueCancelError(null);
    setIsCancellingRevenue(true);
    const revenue = revenueToCancel;

    try {
      const response = await fetch(
        `${adminBackendUrl}/projects/${revenue.projectId}/revenues/${revenue.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status: "cancelado",
          }),
        },
      );

      if (!response.ok) {
        let payload: ApiError | undefined;
        try {
          payload = (await response.json()) as ApiError;
        } catch {
          payload = undefined;
        }

        setRevenueCancelError(
          getApiErrorMessage(payload, "Não foi possível cancelar a receita."),
        );
        return;
      }

      closeRevenueCancelModal();
      await loadProjectRevenues(revenue.projectId);
    } catch {
      setRevenueCancelError("Falha de conexão com a API.");
    } finally {
      setIsCancellingRevenue(false);
    }
  };

  const buildRevenueReceiptFromFile = (file: File): RevenueReceiptFormData => ({
    fileName: file.name,
    fileKey: file.name,
    contentType: file.type || "",
    issuedOn: "",
    notes: "",
  });

  const setRevenueReceiptFile = (file: File) => {
    setRevenueForm((currentForm) => ({
      ...currentForm,
      receipts: [buildRevenueReceiptFromFile(file)],
    }));
  };

  const clearRevenueReceiptFile = () => {
    setRevenueForm((currentForm) => ({
      ...currentForm,
      receipts: [],
    }));
    if (revenueReceiptFileInputRef.current) {
      revenueReceiptFileInputRef.current.value = "";
    }
  };

  const handleRevenueReceiptFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    setRevenueReceiptFile(file);
    event.target.value = "";
  };

  const handleRevenueReceiptDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (!file) {
      return;
    }
    setRevenueReceiptFile(file);
  };

  const handleRevenueReceiptPaste = (event: ClipboardEvent<HTMLDivElement>) => {
    const file = event.clipboardData.files?.[0];
    if (!file) {
      return;
    }
    event.preventDefault();
    setRevenueReceiptFile(file);
  };

  const handleRevenueReceiptAreaKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }
    event.preventDefault();
    revenueReceiptFileInputRef.current?.click();
  };

  const openChargeModal = (chargeToEdit: ProjectMonthlyCharge | null = null) => {
    if (
      chargeToEdit &&
      normalizeMonthlyChargeStatusValue(chargeToEdit.status) !== "pendente"
    ) {
      setChargeActionsError("Cobranças pagas ou canceladas não podem ser editadas.");
      return;
    }

    if (chargeToEdit) {
      setEditingChargeID(chargeToEdit.id);
      setChargeForm({
        projectId: chargeToEdit.projectId,
        title: chargeToEdit.title || "",
        description: chargeToEdit.description || "",
        installment: chargeToEdit.installment || "",
        status: normalizeMonthlyChargeStatusValue(chargeToEdit.status),
        amount: chargeToEdit.amount.toFixed(2),
        dueDay: String(chargeToEdit.dueDay || 1),
        startsOn: toDateInputValue(chargeToEdit.startsOn),
        endsOn: toDateInputValue(chargeToEdit.endsOn),
        active: chargeToEdit.active,
      });
    } else {
      setEditingChargeID(null);
      setChargeForm(createEmptyChargeForm(selectedChargeProjectId));
    }
    setChargeFormError(null);
    setChargeActionsError(null);
    setIsChargeModalOpen(true);
  };

  const handleUpdateChargeStatus = async (
    charge: ProjectMonthlyCharge,
    nextStatus: "pago" | "cancelada",
  ) => {
    const token = readTokenFromCookie();
    if (!token) {
      setChargeActionsError("Sessão inválida. Faça login novamente.");
      return;
    }

    setChargeActionsError(null);
    setUpdatingChargeStatusID(charge.id);

    try {
      const response = await fetch(
        `${adminBackendUrl}/projects/${charge.projectId}/monthly-charges/${charge.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status: nextStatus,
          }),
        },
      );

      const payload = (await response.json()) as ProjectMonthlyCharge | ApiError;
      if (!response.ok) {
        setChargeActionsError(
          getApiErrorMessage(payload, "Não foi possível atualizar o status da cobrança."),
        );
        return;
      }

      await loadProjectMonthlyCharges(charge.projectId);
    } catch {
      setChargeActionsError("Falha de conexão com a API.");
    } finally {
      setUpdatingChargeStatusID(null);
    }
  };

  const openChargeAmountModal = (charge: ProjectMonthlyCharge) => {
    if (normalizeMonthlyChargeStatusValue(charge.status) !== "pendente") {
      setChargeActionsError("Cobranças pagas ou canceladas não podem ser editadas.");
      return;
    }

    setEditingCharge(charge);
    setChargeAmountFormValue(charge.amount.toFixed(2));
    setChargeAmountFormError(null);
    setIsChargeAmountModalOpen(true);
  };

  const openChargeDeleteModal = (charge: ProjectMonthlyCharge) => {
    setChargeToDelete(charge);
    setChargeDeleteError(null);
    setChargeActionsError(null);
    setIsChargeDeleteModalOpen(true);
  };

  const closeChargeDeleteModal = () => {
    setIsChargeDeleteModalOpen(false);
    setChargeToDelete(null);
    setChargeDeleteError(null);
  };

  const handleDeleteCharge = async () => {
    if (!chargeToDelete) {
      return;
    }

    const token = readTokenFromCookie();
    if (!token) {
      setChargeDeleteError("Sessão inválida. Faça login novamente.");
      return;
    }

    setChargeDeleteError(null);
    setChargeActionsError(null);
    setIsDeletingCharge(true);
    const charge = chargeToDelete;

    try {
      const response = await fetch(
        `${adminBackendUrl}/projects/${charge.projectId}/monthly-charges/${charge.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        let payload: ApiError | undefined;
        try {
          payload = (await response.json()) as ApiError;
        } catch {
          payload = undefined;
        }

        const message = getApiErrorMessage(payload, "Não foi possível excluir a cobrança.");
        setChargeDeleteError(message);
        setChargeActionsError(message);
        return;
      }

      closeChargeDeleteModal();
      await loadProjects(token);
      await loadProjectMonthlyCharges(charge.projectId);
    } catch {
      setChargeDeleteError("Falha de conexão com a API.");
    } finally {
      setIsDeletingCharge(false);
    }
  };

  const openRoadmapModal = async (projectId: string) => {
    setRoadmapProject(null);
    setRoadmapError(null);
    setIsRefreshingRoadmap(false);
    setIsRecalculatingRoadmap(false);
    setIsExportingRoadmapPdf(false);
    handleCloseExportModal();
    setIsPhaseModalOpen(false);
    setIsSubPhaseModalOpen(false);
    setIsTaskModalOpen(false);
    closeTaskCommentsModal();
    setPhaseForm(createEmptyPhaseForm());
    setSubPhaseForm(createEmptySubPhaseForm());
    setTaskForm(createEmptyTaskForm());
    setPhaseFormError(null);
    setSubPhaseFormError(null);
    setTaskFormError(null);
    setSelectedPhaseForSubPhase(null);
    setTaskModalContext(null);
    setEditingPhase(null);
    setEditingSubPhase(null);
    setEditingTask(null);
    setIsRoadmapModalOpen(true);
    await loadProjectDetail(projectId);
  };

  const openPhaseModal = (phaseToEdit: ProjectPhase | null = null) => {
    if (phaseToEdit) {
      setEditingPhase(phaseToEdit);
      setPhaseForm({
        name: phaseToEdit.name || "",
        description: phaseToEdit.description || "",
        startsOn: toDateInputValue(phaseToEdit.startsOn),
        endsOn: toDateInputValue(phaseToEdit.endsOn),
      });
    } else {
      setEditingPhase(null);
      setPhaseForm(createEmptyPhaseForm());
    }
    setPhaseFormError(null);
    setIsPhaseModalOpen(true);
  };

  const openSubPhaseModal = (
    phase: ProjectPhase,
    subPhaseToEdit: ProjectTask | null = null,
  ) => {
    setSelectedPhaseForSubPhase(phase);
    if (subPhaseToEdit) {
      setEditingSubPhase(subPhaseToEdit);
      setSubPhaseForm({
        name: subPhaseToEdit.name || "",
        description: subPhaseToEdit.description || "",
        startsOn: toDateInputValue(subPhaseToEdit.startsOn),
        endsOn: toDateInputValue(subPhaseToEdit.endsOn),
      });
    } else {
      setEditingSubPhase(null);
      setSubPhaseForm(createEmptySubPhaseForm());
    }
    setSubPhaseFormError(null);
    setIsSubPhaseModalOpen(true);
  };

  const openTaskModal = (
    phase: ProjectPhase,
    subPhase: ProjectTask | null = null,
    taskToEdit: ProjectTask | null = null,
  ) => {
    setTaskModalContext({ phase, subPhase });
    if (taskToEdit) {
      setEditingTask(taskToEdit);
      setTaskForm({
        name: taskToEdit.name || "",
        description: taskToEdit.description || "",
        startsOn: toDateInputValue(taskToEdit.startsOn),
        endsOn: toDateInputValue(taskToEdit.endsOn),
        status: normalizeTaskStatusValue(taskToEdit.status),
        responsibleUserId: taskToEdit.responsibleUserId || "",
      });
    } else {
      setEditingTask(null);
      setTaskForm(createEmptyTaskForm());
    }
    setTaskFormError(null);
    setIsTaskModalOpen(true);
  };

  const handleSubmitProject = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const token = readTokenFromCookie();
    if (!token) {
      setProjectFormError("Sessão inválida. Faça login novamente.");
      return;
    }

    if (!projectForm.name.trim()) {
      setProjectFormError("Informe o nome do projeto.");
      return;
    }

    setProjectFormError(null);
    setIsSavingProject(true);

    try {
      const response = await fetch(
        editingProjectID
          ? `${adminBackendUrl}/projects/${editingProjectID}`
          : `${adminBackendUrl}/projects`,
        {
          method: editingProjectID ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: projectForm.name,
            objective: projectForm.objective,
            projectTypeId: projectForm.projectTypeId,
            lifecycleType: projectForm.lifecycleType,
            hasMonthlyMaintenance: projectForm.hasMonthlyMaintenance,
            startDate: projectForm.startDate,
            endDate: projectForm.endDate,
            active: projectForm.active,
            clientIds: projectForm.clientIds,
            managerUserIds: projectForm.managerUserIds,
          }),
        },
      );

      const payload = (await response.json()) as ProjectDetail | ApiError;
      if (!response.ok) {
        setProjectFormError(
          getApiErrorMessage(
            payload,
            editingProjectID
              ? "Não foi possível atualizar o projeto."
              : "Não foi possível salvar o projeto.",
          ),
        );
        return;
      }

      setEditingProjectID(null);
      setIsProjectModalOpen(false);
      await loadInitialData();
    } catch {
      setProjectFormError("Falha de conexão com a API.");
    } finally {
      setIsSavingProject(false);
    }
  };

  const handleSubmitProjectType = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const token = readTokenFromCookie();
    if (!token) {
      setProjectTypeFormError("Sessão inválida. Faça login novamente.");
      return;
    }

    if (
      !projectTypeForm.categoryId.trim() ||
      !projectTypeForm.code.trim() ||
      !projectTypeForm.name.trim()
    ) {
      setProjectTypeFormError("Categoria, código e nome são obrigatórios.");
      return;
    }

    setProjectTypeFormError(null);
    setIsSavingProjectType(true);

    try {
      const response = await fetch(`${adminBackendUrl}/project-types`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          categoryId: projectTypeForm.categoryId,
          code: projectTypeForm.code.trim().toLowerCase(),
          name: projectTypeForm.name,
          description: projectTypeForm.description,
          active: projectTypeForm.active,
        }),
      });

      const payload = (await response.json()) as ProjectType | ApiError;
      if (!response.ok) {
        setProjectTypeFormError(
          getApiErrorMessage(payload, "Não foi possível salvar o tipo de projeto."),
        );
        return;
      }

      await loadInitialData();
      setIsProjectTypeModalOpen(false);
    } catch {
      setProjectTypeFormError("Falha de conexão com a API.");
    } finally {
      setIsSavingProjectType(false);
    }
  };

  const handleSubmitRevenue = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const token = readTokenFromCookie();
    if (!token) {
      setRevenueFormError("Sessão inválida. Faça login novamente.");
      return;
    }

    const amount = Number.parseFloat(revenueForm.amount.replace(",", "."));
    if (!revenueForm.projectId || !revenueForm.title.trim() || Number.isNaN(amount)) {
      setRevenueFormError("Projeto, título e valor válido são obrigatórios.");
      return;
    }

    setRevenueFormError(null);
    setIsSavingRevenue(true);

    try {
      const response = await fetch(
        `${adminBackendUrl}/projects/${revenueForm.projectId}/revenues`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: revenueForm.title,
            description: revenueForm.description,
            objective: revenueForm.objective,
            amount,
            expectedOn: revenueForm.expectedOn,
            receivedOn: revenueForm.receivedOn,
            active: revenueForm.active,
            receipts: revenueForm.receipts,
          }),
        },
      );

      const payload = (await response.json()) as ProjectRevenue | ApiError;
      if (!response.ok) {
        setRevenueFormError(
          getApiErrorMessage(payload, "Não foi possível salvar a receita."),
        );
        return;
      }

      setIsRevenueModalOpen(false);
      await loadProjects(token);
      await loadProjectRevenues(revenueForm.projectId);
    } catch {
      setRevenueFormError("Falha de conexão com a API.");
    } finally {
      setIsSavingRevenue(false);
    }
  };

  const handleSubmitCharge = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const token = readTokenFromCookie();
    if (!token) {
      setChargeFormError("Sessão inválida. Faça login novamente.");
      return;
    }

    const amount = Number.parseFloat(chargeForm.amount.replace(",", "."));
    const dueDay = Number.parseInt(chargeForm.dueDay, 10);
    if (!chargeForm.title.trim()) {
      setChargeFormError("Informe o título da cobrança.");
      return;
    }
    if (
      !chargeForm.projectId ||
      Number.isNaN(amount) ||
      Number.isNaN(dueDay)
    ) {
      setChargeFormError("Projeto, título, valor e dia de vencimento são obrigatórios.");
      return;
    }

    setChargeFormError(null);
    setIsSavingCharge(true);

    try {
      const isEditingCharge = Boolean(editingChargeID);
      const response = await fetch(
        isEditingCharge
          ? `${adminBackendUrl}/projects/${chargeForm.projectId}/monthly-charges/${editingChargeID}`
          : `${adminBackendUrl}/projects/${chargeForm.projectId}/monthly-charges`,
        {
          method: isEditingCharge ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: chargeForm.title,
            description: chargeForm.description,
            installment: chargeForm.installment,
            status: chargeForm.status,
            amount,
            dueDay,
            startsOn: chargeForm.startsOn,
            endsOn: chargeForm.endsOn,
            active: chargeForm.active,
          }),
        },
      );

      const payload = (await response.json()) as ProjectMonthlyCharge | ApiError;
      if (!response.ok) {
        setChargeFormError(
          getApiErrorMessage(
            payload,
            isEditingCharge
              ? "Não foi possível atualizar a cobrança."
              : "Não foi possível salvar a cobrança.",
          ),
        );
        return;
      }

      setIsChargeModalOpen(false);
      setEditingChargeID(null);
      await loadProjects(token);
      await loadProjectMonthlyCharges(chargeForm.projectId);
    } catch {
      setChargeFormError("Falha de conexão com a API.");
    } finally {
      setIsSavingCharge(false);
    }
  };

  const handleSubmitChargeAmount = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!editingCharge) {
      return;
    }

    const token = readTokenFromCookie();
    if (!token) {
      setChargeAmountFormError("Sessão inválida. Faça login novamente.");
      return;
    }

    const amount = Number.parseFloat(chargeAmountFormValue.replace(",", "."));
    if (Number.isNaN(amount) || amount < 0) {
      setChargeAmountFormError("Informe um valor válido.");
      return;
    }

    setChargeAmountFormError(null);
    setIsSavingChargeAmount(true);

    try {
      const response = await fetch(
        `${adminBackendUrl}/projects/${editingCharge.projectId}/monthly-charges/${editingCharge.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            amount,
          }),
        },
      );

      const payload = (await response.json()) as ProjectMonthlyCharge | ApiError;
      if (!response.ok) {
        setChargeAmountFormError(
          getApiErrorMessage(payload, "Não foi possível atualizar o valor da cobrança."),
        );
        return;
      }

      setIsChargeAmountModalOpen(false);
      setEditingCharge(null);
      setChargeAmountFormValue("");
      await loadProjectMonthlyCharges(editingCharge.projectId);
    } catch {
      setChargeAmountFormError("Falha de conexão com a API.");
    } finally {
      setIsSavingChargeAmount(false);
    }
  };

  const handleSubmitPhase = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!roadmapProject?.id) {
      return;
    }

    const token = readTokenFromCookie();
    if (!token) {
      setPhaseFormError("Sessão inválida. Faça login novamente.");
      return;
    }

    if (!phaseForm.name.trim()) {
      setPhaseFormError("Informe o nome da fase.");
      return;
    }

    setPhaseFormError(null);
    setIsSavingPhase(true);

    try {
      const response = await fetch(
        editingPhase
          ? `${adminBackendUrl}/projects/${roadmapProject.id}/phases/${editingPhase.id}`
          : `${adminBackendUrl}/projects/${roadmapProject.id}/phases`,
        {
          method: editingPhase ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: phaseForm.name,
            description: phaseForm.description,
            objective: editingPhase?.objective || "",
            startsOn: phaseForm.startsOn,
            endsOn: phaseForm.endsOn,
            position: editingPhase ? editingPhase.position : roadmapProject.phases.length,
            active: editingPhase ? editingPhase.active : true,
            files: [],
          }),
        },
      );

      const payload = (await response.json()) as ProjectPhase | ApiError;
      if (!response.ok) {
        setPhaseFormError(
          getApiErrorMessage(
            payload,
            editingPhase
              ? "Não foi possível atualizar a fase."
              : "Não foi possível cadastrar a fase.",
          ),
        );
        return;
      }

      setPhaseForm(createEmptyPhaseForm());
      setEditingPhase(null);
      setIsPhaseModalOpen(false);
      await loadProjectDetail(roadmapProject.id);
      await loadInitialData();
    } catch {
      setPhaseFormError("Falha de conexão com a API.");
    } finally {
      setIsSavingPhase(false);
    }
  };

  const handleSubmitSubPhase = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!roadmapProject?.id || !selectedPhaseForSubPhase) {
      return;
    }

    const token = readTokenFromCookie();
    if (!token) {
      setSubPhaseFormError("Sessão inválida. Faça login novamente.");
      return;
    }

    if (!subPhaseForm.name.trim()) {
      setSubPhaseFormError("Informe o título da sub-fase.");
      return;
    }

    setSubPhaseFormError(null);
    setIsSavingSubPhase(true);

    try {
      const phaseTaskCount = roadmapProject.tasks.filter(
        (task) => task.projectPhaseId === selectedPhaseForSubPhase.id,
      ).length;

      const response = await fetch(
        editingSubPhase
          ? `${adminBackendUrl}/projects/${roadmapProject.id}/tasks/${editingSubPhase.id}`
          : `${adminBackendUrl}/projects/${roadmapProject.id}/tasks`,
        {
          method: editingSubPhase ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            projectPhaseId: selectedPhaseForSubPhase.id,
            name: subPhaseForm.name,
            description: subPhaseForm.description,
            objective: editingSubPhase?.objective || encodePlannerTaskMeta({ kind: "subphase" }),
            startsOn: subPhaseForm.startsOn,
            endsOn: subPhaseForm.endsOn,
            position: editingSubPhase ? editingSubPhase.position : phaseTaskCount,
            status: editingSubPhase?.status || "planejada",
            active: editingSubPhase ? editingSubPhase.active : true,
            files: [],
          }),
        },
      );

      const payload = (await response.json()) as ProjectTask | ApiError;
      if (!response.ok) {
        setSubPhaseFormError(
          getApiErrorMessage(
            payload,
            editingSubPhase
              ? "Não foi possível atualizar a sub-fase."
              : "Não foi possível cadastrar a sub-fase.",
          ),
        );
        return;
      }

      setSubPhaseForm(createEmptySubPhaseForm());
      setEditingSubPhase(null);
      setIsSubPhaseModalOpen(false);
      await loadProjectDetail(roadmapProject.id);
      await loadInitialData();
    } catch {
      setSubPhaseFormError("Falha de conexão com a API.");
    } finally {
      setIsSavingSubPhase(false);
    }
  };

  const handleSubmitTask = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!roadmapProject?.id || !taskModalContext) {
      return;
    }

    const token = readTokenFromCookie();
    if (!token) {
      setTaskFormError("Sessão inválida. Faça login novamente.");
      return;
    }

    if (!taskForm.name.trim()) {
      setTaskFormError("Informe o título da tarefa.");
      return;
    }

    setTaskFormError(null);
    setIsSavingTask(true);

    try {
      let response: Response;
      if (editingTask) {
        response = await fetch(
          `${adminBackendUrl}/projects/${roadmapProject.id}/tasks/${editingTask.id}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              projectPhaseId: taskModalContext.phase.id,
              name: taskForm.name,
              description: taskForm.description,
              objective: editingTask.objective,
              startsOn: taskForm.startsOn,
              endsOn: taskForm.endsOn,
              position: editingTask.position,
              status: taskForm.status,
              responsibleUserId: taskForm.responsibleUserId,
              active: editingTask.active,
            }),
          },
        );
      } else {
        const phaseTaskCount = roadmapProject.tasks.filter(
          (task) => task.projectPhaseId === taskModalContext.phase.id,
        ).length;

        response = await fetch(`${adminBackendUrl}/projects/${roadmapProject.id}/tasks`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            projectPhaseId: taskModalContext.phase.id,
            name: taskForm.name,
            description: taskForm.description,
            objective: encodePlannerTaskMeta({
              kind: "task",
              parentType: taskModalContext.subPhase ? "subphase" : "phase",
              parentId: taskModalContext.subPhase?.id,
            }),
            startsOn: taskForm.startsOn,
            endsOn: taskForm.endsOn,
            position: phaseTaskCount,
            status: taskForm.status,
            responsibleUserId: taskForm.responsibleUserId,
            active: true,
            files: [],
          }),
        });
      }

      const payload = (await response.json()) as ProjectTask | ApiError;
      if (!response.ok) {
        setTaskFormError(
          getApiErrorMessage(
            payload,
            editingTask
              ? "Não foi possível atualizar a tarefa."
              : "Não foi possível cadastrar a tarefa.",
          ),
        );
        return;
      }

      setTaskForm(createEmptyTaskForm());
      setEditingTask(null);
      setIsTaskModalOpen(false);
      await loadProjectDetail(roadmapProject.id);
      await loadInitialData();
    } catch {
      setTaskFormError("Falha de conexão com a API.");
    } finally {
      setIsSavingTask(false);
    }
  };

  const loadTaskComments = async (projectId: string, taskId: string) => {
    const token = readTokenFromCookie();
    if (!token) {
      setTaskCommentsError("Sessão inválida. Faça login novamente.");
      return;
    }

    setIsLoadingTaskComments(true);
    setTaskCommentsError(null);

    try {
      const response = await fetch(
        `${adminBackendUrl}/projects/${projectId}/tasks/${taskId}/comments`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const payload = (await response.json()) as ProjectTaskComment[] | ApiError;
      if (!response.ok) {
        setTaskCommentsError(
          getApiErrorMessage(payload, "Não foi possível carregar os comentários da tarefa."),
        );
        return;
      }

      setTaskComments(Array.isArray(payload) ? payload : []);
    } catch {
      setTaskCommentsError("Falha de conexão com a API.");
    } finally {
      setIsLoadingTaskComments(false);
    }
  };

  const openTaskCommentsModal = (phase: ProjectPhase, subPhase: ProjectTask | null, task: ProjectTask) => {
    if (!roadmapProject?.id) {
      return;
    }

    setTaskCommentModalContext({ phase, subPhase, task });
    setTaskComments([]);
    setTaskCommentsError(null);
    setTaskCommentForm(createEmptyTaskCommentForm());
    setTaskCommentFormError(null);
    setIsTaskCommentsModalOpen(true);
    void loadTaskComments(roadmapProject.id, task.id);
  };

  const closeTaskCommentsModal = () => {
    setIsTaskCommentsModalOpen(false);
    setTaskCommentModalContext(null);
    setTaskComments([]);
    setTaskCommentsError(null);
    setTaskCommentForm(createEmptyTaskCommentForm());
    setTaskCommentFormError(null);
    setIsSavingTaskComment(false);
    if (taskCommentFileInputRef.current) {
      taskCommentFileInputRef.current.value = "";
    }
  };

  const buildTaskCommentFileFromFile = (file: File): RevenueReceiptFormData => ({
    fileName: file.name,
    fileKey: file.name,
    contentType: file.type || "",
    issuedOn: "",
    notes: "",
  });

  const setTaskCommentFile = (file: File) => {
    setTaskCommentForm((currentForm) => ({
      ...currentForm,
      files: [buildTaskCommentFileFromFile(file)],
    }));
  };

  const clearTaskCommentFile = () => {
    setTaskCommentForm((currentForm) => ({
      ...currentForm,
      files: [],
    }));
    if (taskCommentFileInputRef.current) {
      taskCommentFileInputRef.current.value = "";
    }
  };

  const handleTaskCommentFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    setTaskCommentFile(file);
    event.target.value = "";
  };

  const handleTaskCommentDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (!file) {
      return;
    }
    setTaskCommentFile(file);
  };

  const handleTaskCommentPaste = (event: ClipboardEvent<HTMLDivElement>) => {
    const file = event.clipboardData.files?.[0];
    if (!file) {
      return;
    }
    event.preventDefault();
    setTaskCommentFile(file);
  };

  const handleTaskCommentAreaKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }
    event.preventDefault();
    taskCommentFileInputRef.current?.click();
  };

  const handleStartReplyToComment = (comment: ProjectTaskComment) => {
    setTaskCommentForm((currentForm) => ({
      ...currentForm,
      parentCommentId: comment.id,
    }));
    taskCommentTextareaRef.current?.focus();
  };

  const handleClearReplyTarget = () => {
    setTaskCommentForm((currentForm) => ({
      ...currentForm,
      parentCommentId: "",
    }));
  };

  const handleSubmitTaskComment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!roadmapProject?.id || !taskCommentModalContext?.task.id) {
      return;
    }

    const token = readTokenFromCookie();
    if (!token) {
      setTaskCommentFormError("Sessão inválida. Faça login novamente.");
      return;
    }

    if (!taskCommentForm.comment.trim()) {
      setTaskCommentFormError("Informe o comentário da tarefa.");
      return;
    }

    setTaskCommentFormError(null);
    setIsSavingTaskComment(true);

    try {
      const response = await fetch(
        `${adminBackendUrl}/projects/${roadmapProject.id}/tasks/${taskCommentModalContext.task.id}/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            parentCommentId: taskCommentForm.parentCommentId,
            comment: taskCommentForm.comment,
            files: taskCommentForm.files.map((file) => ({
              fileName: file.fileName,
              fileKey: file.fileKey,
              contentType: file.contentType,
              notes: file.notes,
            })),
          }),
        },
      );

      const payload = (await response.json()) as ProjectTaskComment | ApiError;
      if (!response.ok) {
        setTaskCommentFormError(
          getApiErrorMessage(payload, "Não foi possível salvar o comentário da tarefa."),
        );
        return;
      }

      setTaskCommentForm(createEmptyTaskCommentForm());
      if (taskCommentFileInputRef.current) {
        taskCommentFileInputRef.current.value = "";
      }
      await loadTaskComments(roadmapProject.id, taskCommentModalContext.task.id);
    } catch {
      setTaskCommentFormError("Falha de conexão com a API.");
    } finally {
      setIsSavingTaskComment(false);
    }
  };

  const handleDeletePlaceholder = (itemLabel: string) => {
    setRoadmapError(`A opção de excluir ${itemLabel} será implementada em seguida.`);
  };

  const totalProjects = projects.length;

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-default-200 bg-content1/70 p-6 backdrop-blur-md">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-foreground/60">
              <MaterialSymbol name="workspaces" className="text-[16px]" />
              Projetos
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-foreground">Projetos</h1>
            <p className="mt-2 text-sm text-foreground/80">
              Organize projetos, tipos, receitas, cobranças mensais e o planejamento
              de fases e tarefas.
            </p>
            <p className="mt-2 text-sm font-medium text-foreground/80">
              Total de projetos: {totalProjects}
            </p>
          </div>

          {activeMenu === "projetos" ? (
            <Button
              color="primary"
              startContent={<MaterialSymbol name="add" className="text-[18px]" />}
              onPress={openProjectModal}
            >
              Novo projeto
            </Button>
          ) : null}

          {activeMenu === "tipos" ? (
            <Button
              color="primary"
              startContent={<MaterialSymbol name="add" className="text-[18px]" />}
              onPress={openProjectTypeModal}
            >
              Novo tipo
            </Button>
          ) : null}

          {activeMenu === "receitas" ? (
            <Button
              color="primary"
              startContent={<MaterialSymbol name="add" className="text-[18px]" />}
              onPress={openRevenueModal}
              isDisabled={!selectedRevenueProjectId}
            >
              Nova receita
            </Button>
          ) : null}

          {activeMenu === "cobrancas" ? (
            <Button
              color="primary"
              startContent={<MaterialSymbol name="add" className="text-[18px]" />}
              onPress={() => openChargeModal()}
              isDisabled={!selectedChargeProjectId}
            >
              Nova cobrança
            </Button>
          ) : null}
        </div>
      </div>

      <div className="rounded-2xl border border-default-200 bg-content1/70 p-3 backdrop-blur-md">
        <div className="flex flex-wrap gap-2">
          {submenuItems.map((item) => (
            <Button
              key={item.key}
              size="sm"
              variant={activeMenu === item.key ? "solid" : "flat"}
              color={activeMenu === item.key ? "primary" : "default"}
              startContent={<MaterialSymbol name={item.icon} className="text-[18px]" />}
              onPress={() => setActiveMenu(item.key)}
            >
              {item.label}
            </Button>
          ))}
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      ) : null}

      {activeMenu === "projetos" ? (
        <div className="overflow-hidden rounded-2xl border border-default-200 bg-content1/70 backdrop-blur-md">
          <div className="border-b border-default-200 px-4 py-3">
            <Input
              value={searchValue}
              onValueChange={setSearchValue}
              placeholder="Pesquisar por nome, objetivo, tipo ou categoria"
              startContent={<MaterialSymbol name="search" className="text-[18px]" />}
              className="max-w-xl"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-content1/70">
                <tr className="border-b border-default-200">
                  <th className="px-4 py-3 font-semibold text-foreground/80">Projeto</th>
                  <th className="px-4 py-3 font-semibold text-foreground/80">Tipo</th>
                  <th className="px-4 py-3 font-semibold text-foreground/80">Ciclo</th>
                  <th className="px-4 py-3 font-semibold text-foreground/80">Clientes</th>
                  <th className="px-4 py-3 font-semibold text-foreground/80">Planejamento</th>
                  <th className="px-4 py-3 font-semibold text-foreground/80">Início</th>
                  <th className="px-4 py-3 font-semibold text-foreground/80">Fim</th>
                  <th className="px-4 py-3 font-semibold text-foreground/80">Status</th>
                  <th className="px-4 py-3 text-right font-semibold text-foreground/80">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td className="px-4 py-6 text-foreground/70" colSpan={9}>
                      Carregando projetos...
                    </td>
                  </tr>
                ) : null}

                {!isLoading && filteredProjects.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-foreground/70" colSpan={9}>
                      Nenhum projeto encontrado.
                    </td>
                  </tr>
                ) : null}

                {!isLoading
                  ? filteredProjects.map((project) => {
                      const normalizedProjectStatus = normalizeProjectStatusValue(
                        project.status,
                        project.active,
                      );

                      return (
                        <tr
                          key={project.id}
                          className="border-b border-default-200/70 last:border-b-0"
                        >
                        <td className="px-4 py-3">
                          <p className="font-medium text-foreground">{project.name}</p>
                          <p className="max-w-[320px] text-xs text-foreground/70">
                            {project.objective || "Sem objetivo cadastrado."}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-foreground/80">
                          {project.projectTypeName || "-"}
                          <p className="text-xs text-foreground/60">
                            {project.projectCategoryName || "Sem categoria"}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-foreground/80">
                          {project.lifecycleType === "recorrente"
                            ? "Recorrente"
                            : "Temporário"}
                          <p className="text-xs text-foreground/60">
                            {project.hasMonthlyMaintenance
                              ? "Com manutenção mensal"
                              : "Sem manutenção mensal"}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-foreground/80">{project.clientsCount}</td>
                        <td className="px-4 py-3 text-foreground/80">
                          {project.phasesCount} fases | {project.tasksCount} tarefas
                        </td>
                        <td className="px-4 py-3 text-foreground/80">
                          {formatDate(project.startDate)}
                        </td>
                        <td className="px-4 py-3 text-foreground/80">
                          {formatDate(project.endDate)}
                        </td>
                          <td className="px-4 py-3">
                            <span
                              className={`rounded-full border px-2.5 py-1 text-xs font-medium ${getProjectStatusBadgeClassName(
                                normalizedProjectStatus,
                              )}`}
                            >
                              {formatProjectStatusLabel(normalizedProjectStatus)}
                            </span>
                          </td>
                        <td className="px-4 py-3 text-right">
                          <Dropdown placement="bottom-end">
                            <DropdownTrigger>
                              <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                aria-label={`Menu de ações do projeto ${project.name}`}
                              >
                                <MaterialSymbol name="more_vert" className="text-[20px]" />
                              </Button>
                            </DropdownTrigger>
                            <DropdownMenu
                              aria-label={`Ações do projeto ${project.name}`}
                              onAction={(key) => {
                                const action = String(key);
                                if (action === "roadmap") {
                                  void openRoadmapModal(project.id);
                                  return;
                                }
                                if (action === "edit") {
                                  void openProjectEditModal(project.id);
                                  return;
                                }
                                if (action === "complete") {
                                  openProjectStatusModal(project, "concluido");
                                  return;
                                }
                                if (action === "cancel") {
                                  openProjectStatusModal(project, "cancelado");
                                  return;
                                }
                                if (action === "delete") {
                                  void handleDeleteProject(project);
                                }
                              }}
                            >
                              <DropdownItem
                                key="roadmap"
                                startContent={
                                  <MaterialSymbol name="checklist" className="text-[18px]" />
                                }
                              >
                                Fases e tarefas
                              </DropdownItem>
                              <DropdownItem
                                key="edit"
                                startContent={
                                  <MaterialSymbol name="edit" className="text-[18px]" />
                                }
                              >
                                Editar projeto
                              </DropdownItem>
                              <DropdownItem
                                key="complete"
                                isDisabled={
                                  normalizedProjectStatus === "concluido" ||
                                  normalizedProjectStatus === "cancelado"
                                }
                                startContent={
                                  <MaterialSymbol name="task_alt" className="text-[18px]" />
                                }
                              >
                                Concluir
                              </DropdownItem>
                              <DropdownItem
                                key="cancel"
                                color="danger"
                                className="text-danger"
                                isDisabled={normalizedProjectStatus === "cancelado"}
                                startContent={
                                  <MaterialSymbol name="cancel" className="text-[18px]" />
                                }
                              >
                                Cancelar
                              </DropdownItem>
                              <DropdownItem
                                key="delete"
                                color="danger"
                                className="text-danger"
                                startContent={
                                  <MaterialSymbol name="delete" className="text-[18px]" />
                                }
                              >
                                Excluir
                              </DropdownItem>
                            </DropdownMenu>
                          </Dropdown>
                        </td>
                        </tr>
                      );
                    })
                  : null}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {activeMenu === "tipos" ? (
        <div className="overflow-hidden rounded-2xl border border-default-200 bg-content1/70 backdrop-blur-md">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-content1/70">
                <tr className="border-b border-default-200">
                  <th className="px-4 py-3 font-semibold text-foreground/80">Categoria</th>
                  <th className="px-4 py-3 font-semibold text-foreground/80">Código</th>
                  <th className="px-4 py-3 font-semibold text-foreground/80">Nome</th>
                  <th className="px-4 py-3 font-semibold text-foreground/80">Descrição</th>
                  <th className="px-4 py-3 font-semibold text-foreground/80">Status</th>
                  <th className="px-4 py-3 text-right font-semibold text-foreground/80">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td className="px-4 py-6 text-foreground/70" colSpan={6}>
                      Carregando tipos de projeto...
                    </td>
                  </tr>
                ) : null}

                {!isLoading && projectTypes.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-foreground/70" colSpan={6}>
                      Nenhum tipo de projeto cadastrado.
                    </td>
                  </tr>
                ) : null}

                {!isLoading
                  ? projectTypes.map((projectType) => (
                      <tr
                        key={projectType.id}
                        className="border-b border-default-200/70 last:border-b-0"
                      >
                        <td className="px-4 py-3 text-foreground/80">
                          {projectType.categoryName}
                        </td>
                        <td className="px-4 py-3 text-foreground/80">{projectType.code}</td>
                        <td className="px-4 py-3 text-foreground">{projectType.name}</td>
                        <td className="px-4 py-3 text-foreground/80">
                          {projectType.description || "-"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={
                              projectType.active
                                ? "rounded-full border border-success/40 bg-success/10 px-2.5 py-1 text-xs font-medium text-success"
                                : "rounded-full border border-danger/40 bg-danger/10 px-2.5 py-1 text-xs font-medium text-danger"
                            }
                          >
                            {projectType.active ? "Ativo" : "Inativo"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Dropdown placement="bottom-end">
                            <DropdownTrigger>
                              <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                aria-label={`Menu de ações do tipo ${projectType.name}`}
                                isDisabled={updatingProjectTypeID === projectType.id}
                              >
                                <MaterialSymbol name="more_vert" className="text-[20px]" />
                              </Button>
                            </DropdownTrigger>
                            <DropdownMenu
                              aria-label={`Ações do tipo ${projectType.name}`}
                              onAction={(key) => {
                                if (String(key) === "deactivate") {
                                  void handleDeactivateProjectType(projectType);
                                }
                              }}
                            >
                              <DropdownItem
                                key="deactivate"
                                color="danger"
                                isDisabled={!projectType.active}
                                startContent={
                                  <MaterialSymbol name="block" className="text-[18px]" />
                                }
                              >
                                Desativar
                              </DropdownItem>
                            </DropdownMenu>
                          </Dropdown>
                        </td>
                      </tr>
                    ))
                  : null}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {activeMenu === "receitas" ? (
        <div className="space-y-3">
          <div className="rounded-2xl border border-default-200 bg-content1/70 p-4 backdrop-blur-md">
            <label className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/60">
              Pesquisar projeto (receitas)
            </label>
            <form className="mt-2 flex gap-2" onSubmit={handleRevenueProjectSearchSubmit}>
              <Input
                value={revenueProjectSearchValue}
                onValueChange={(value) => {
                  setRevenueProjectSearchValue(value);
                  setIsRevenueProjectSearchOpen(true);
                  if (!value.trim()) {
                    setSelectedRevenueProjectId("");
                  }
                }}
                onFocus={() => setIsRevenueProjectSearchOpen(true)}
                placeholder="Digite o nome do projeto"
                startContent={<MaterialSymbol name="search" className="text-[18px]" />}
              />
              <Button
                type="submit"
                variant="flat"
                isDisabled={revenueProjectSearchResults.length === 0}
              >
                Buscar
              </Button>
            </form>

            {selectedRevenueProject ? (
              <p className="mt-2 text-xs text-foreground/70">
                Selecionado: <strong>{selectedRevenueProject.name}</strong>
              </p>
            ) : null}

            {isRevenueProjectSearchOpen ||
            Boolean(revenueProjectSearchValue.trim()) ||
            !selectedRevenueProjectId ? (
              <div className="mt-3 max-h-44 overflow-y-auto rounded-xl border border-default-200 bg-content1/70">
                {revenueProjectSearchResults.length > 0 ? (
                  revenueProjectSearchResults.slice(0, 10).map((project) => (
                    <button
                      type="button"
                      key={project.id}
                      onClick={() => selectRevenueProject(project)}
                      className={`flex w-full items-center justify-between gap-2 border-b border-default-200/70 px-3 py-2 text-left text-sm last:border-b-0 ${
                        selectedRevenueProjectId === project.id
                          ? "bg-primary/10 text-primary"
                          : "text-foreground hover:bg-default-100/70"
                      }`}
                    >
                      <span>{project.name}</span>
                      <span className="text-xs text-foreground/60">
                        {project.projectTypeName || "Sem tipo"}
                      </span>
                    </button>
                  ))
                ) : (
                  <p className="px-3 py-2 text-sm text-foreground/70">
                    Nenhum projeto encontrado.
                  </p>
                )}
              </div>
            ) : null}
          </div>

          <div className="overflow-hidden rounded-2xl border border-default-200 bg-content1/70 backdrop-blur-md">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-content1/70">
                  <tr className="border-b border-default-200">
                    <th className="px-4 py-3 font-semibold text-foreground/80">Título</th>
                    <th className="px-4 py-3 font-semibold text-foreground/80">Valor</th>
                    <th className="px-4 py-3 font-semibold text-foreground/80">Status</th>
                    <th className="px-4 py-3 font-semibold text-foreground/80">Previsto</th>
                    <th className="px-4 py-3 font-semibold text-foreground/80">Recebido</th>
                    <th className="px-4 py-3 font-semibold text-foreground/80">
                      Comprovantes
                    </th>
                    <th className="px-4 py-3 text-right font-semibold text-foreground/80">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingRevenues ? (
                    <tr>
                      <td className="px-4 py-6 text-foreground/70" colSpan={7}>
                        Carregando receitas...
                      </td>
                    </tr>
                  ) : null}

                  {!isLoadingRevenues && selectedRevenueProjectId && revenues.length === 0 ? (
                    <tr>
                      <td className="px-4 py-6 text-foreground/70" colSpan={7}>
                        Nenhuma receita cadastrada para o projeto selecionado.
                      </td>
                    </tr>
                  ) : null}

                  {!isLoadingRevenues && !selectedRevenueProjectId ? (
                    <tr>
                      <td className="px-4 py-6 text-foreground/70" colSpan={7}>
                        Selecione um projeto para visualizar as receitas.
                      </td>
                    </tr>
                  ) : null}

                  {!isLoadingRevenues
                    ? revenues.map((revenue) => (
                        <tr
                          key={revenue.id}
                          className="border-b border-default-200/70 last:border-b-0"
                        >
                          <td className="px-4 py-3 text-foreground">{revenue.title}</td>
                          <td className="px-4 py-3 text-foreground/80">
                            {formatCurrency(revenue.amount)}
                          </td>
                          <td className="px-4 py-3 text-foreground/80">
                            {formatRevenueStatusLabel(revenue.status)}
                          </td>
                          <td className="px-4 py-3 text-foreground/80">
                            {formatDate(revenue.expectedOn)}
                          </td>
                          <td className="px-4 py-3 text-foreground/80">
                            {formatDate(revenue.receivedOn)}
                          </td>
                          <td className="px-4 py-3 text-foreground/80">
                            {revenue.receipts.length > 0 ? (
                              <div className="flex flex-wrap items-center gap-2">
                                {revenue.receipts.map((receipt, index) => {
                                  const receiptKey = receipt.id || `${revenue.id}-receipt-${index}`;
                                  const receiptLink = (receipt.fileKey || "").trim();
                                  const receiptLabel =
                                    (receipt.fileName || "").trim() || receiptLink || "-";
                                  const isImageReceipt = isRevenueReceiptImage(receipt);

                                  if (!receiptLink) {
                                    return (
                                      <Tooltip key={receiptKey} content={receiptLabel} placement="top">
                                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-default-300 bg-default-100 text-foreground/70">
                                          <MaterialSymbol name="description" className="text-[18px]" />
                                        </span>
                                      </Tooltip>
                                    );
                                  }

                                  return (
                                    <Tooltip key={receiptKey} content={receiptLabel} placement="top">
                                      <button
                                        type="button"
                                        onClick={() => openRevenueReceiptModal(receipt)}
                                        title={receiptLink}
                                        className="group relative inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-default-300 bg-default-100"
                                      >
                                        {isImageReceipt ? (
                                          <img
                                            src={receiptLink}
                                            alt={receiptLabel}
                                            loading="lazy"
                                            className="h-full w-full object-cover"
                                          />
                                        ) : (
                                          <MaterialSymbol
                                            name="description"
                                            className="text-[18px] text-foreground/70"
                                          />
                                        )}
                                        <span className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
                                      </button>
                                    </Tooltip>
                                  );
                                })}
                              </div>
                            ) : (
                              "-"
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Dropdown placement="bottom-end">
                              <DropdownTrigger>
                                <Button
                                  isIconOnly
                                  size="sm"
                                  variant="light"
                                  aria-label={`Menu da receita ${revenue.title}`}
                                >
                                  <MaterialSymbol name="more_vert" className="text-[20px]" />
                                </Button>
                              </DropdownTrigger>
                              <DropdownMenu
                                aria-label={`Ações da receita ${revenue.title}`}
                                onAction={(key) => {
                                  if (String(key) === "cancel") {
                                    openRevenueCancelModal(revenue);
                                  }
                                }}
                              >
                                <DropdownItem
                                  key="cancel"
                                  color="danger"
                                  isDisabled={normalizeRevenueStatusValue(revenue.status) === "cancelado"}
                                  startContent={
                                    <MaterialSymbol name="cancel" className="text-[18px]" />
                                  }
                                >
                                  Cancelar
                                </DropdownItem>
                              </DropdownMenu>
                            </Dropdown>
                          </td>
                        </tr>
                      ))
                    : null}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}

      {activeMenu === "cobrancas" ? (
        <div className="space-y-3">
          <div className="rounded-2xl border border-default-200 bg-content1/70 p-4 backdrop-blur-md">
            <label className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/60">
              Pesquisar projeto (cobranças)
            </label>
            <form className="mt-2 flex gap-2" onSubmit={handleChargeProjectSearchSubmit}>
              <Input
                value={chargeProjectSearchValue}
                onValueChange={(value) => {
                  setChargeProjectSearchValue(value);
                  setIsChargeProjectSearchOpen(true);
                  if (!value.trim()) {
                    setSelectedChargeProjectId("");
                  }
                }}
                onFocus={() => setIsChargeProjectSearchOpen(true)}
                placeholder="Digite o nome do projeto"
                startContent={<MaterialSymbol name="search" className="text-[18px]" />}
              />
              <Button
                type="submit"
                variant="flat"
                isDisabled={chargeProjectSearchResults.length === 0}
              >
                Buscar
              </Button>
            </form>

            {selectedChargeProject ? (
              <p className="mt-2 text-xs text-foreground/70">
                Selecionado: <strong>{selectedChargeProject.name}</strong>
              </p>
            ) : null}

            {isChargeProjectSearchOpen ||
            Boolean(chargeProjectSearchValue.trim()) ||
            !selectedChargeProjectId ? (
              <div className="mt-3 max-h-44 overflow-y-auto rounded-xl border border-default-200 bg-content1/70">
                {chargeProjectSearchResults.length > 0 ? (
                  chargeProjectSearchResults.slice(0, 10).map((project) => (
                    <button
                      type="button"
                      key={project.id}
                      onClick={() => selectChargeProject(project)}
                      className={`flex w-full items-center justify-between gap-2 border-b border-default-200/70 px-3 py-2 text-left text-sm last:border-b-0 ${
                        selectedChargeProjectId === project.id
                          ? "bg-primary/10 text-primary"
                          : "text-foreground hover:bg-default-100/70"
                      }`}
                    >
                      <span>{project.name}</span>
                      <span className="text-xs text-foreground/60">
                        {project.projectTypeName || "Sem tipo"}
                      </span>
                    </button>
                  ))
                ) : (
                  <p className="px-3 py-2 text-sm text-foreground/70">
                    Nenhum projeto encontrado.
                  </p>
                )}
              </div>
            ) : null}
          </div>

          <div className="overflow-hidden rounded-2xl border border-default-200 bg-content1/70 backdrop-blur-md">
            <div className="overflow-x-auto">
              {chargeActionsError ? (
                <p className="mx-4 mt-4 rounded-xl border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
                  {chargeActionsError}
                </p>
              ) : null}
              <table className="min-w-full text-left text-sm">
                <thead className="bg-content1/70">
                  <tr className="border-b border-default-200">
                    <th className="px-4 py-3 font-semibold text-foreground/80">Título</th>
                    <th className="px-4 py-3 font-semibold text-foreground/80">Parcela</th>
                    <th className="px-4 py-3 font-semibold text-foreground/80">Valor</th>
                    <th className="px-4 py-3 font-semibold text-foreground/80">Vencimento</th>
                    <th className="px-4 py-3 font-semibold text-foreground/80">Início</th>
                    <th className="px-4 py-3 font-semibold text-foreground/80">Fim</th>
                    <th className="px-4 py-3 font-semibold text-foreground/80">Status</th>
                    <th className="px-4 py-3 text-right font-semibold text-foreground/80">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingCharges ? (
                    <tr>
                      <td className="px-4 py-6 text-foreground/70" colSpan={8}>
                        Carregando cobranças mensais...
                      </td>
                    </tr>
                  ) : null}

                  {!isLoadingCharges && selectedChargeProjectId && monthlyCharges.length === 0 ? (
                    <tr>
                      <td className="px-4 py-6 text-foreground/70" colSpan={8}>
                        Nenhuma cobrança mensal cadastrada para o projeto selecionado.
                      </td>
                    </tr>
                  ) : null}

                  {!isLoadingCharges && !selectedChargeProjectId ? (
                    <tr>
                      <td className="px-4 py-6 text-foreground/70" colSpan={8}>
                        Selecione um projeto para visualizar as cobranças mensais.
                      </td>
                    </tr>
                  ) : null}

                  {!isLoadingCharges
                    ? monthlyCharges.map((charge) => (
                        <tr
                          key={charge.id}
                          className="border-b border-default-200/70 last:border-b-0"
                        >
                          <td className="px-4 py-3 text-foreground">{charge.title}</td>
                          <td className="px-4 py-3 text-foreground/80">
                            {charge.installment || "-"}
                          </td>
                          <td className="px-4 py-3 text-foreground/80">
                            {formatCurrency(charge.amount)}
                          </td>
                          <td className="px-4 py-3 text-foreground/80">Dia {charge.dueDay}</td>
                          <td className="px-4 py-3 text-foreground/80">
                            {formatDate(charge.startsOn)}
                          </td>
                          <td className="px-4 py-3 text-foreground/80">
                            {formatDate(charge.endsOn)}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`rounded-full border px-2.5 py-1 text-xs font-medium ${getMonthlyChargeStatusBadgeClassName(
                                charge.status,
                              )}`}
                            >
                              {formatMonthlyChargeStatusLabel(charge.status)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            {normalizeMonthlyChargeStatusValue(charge.status) === "pendente" ? (
                              <Dropdown placement="bottom-end">
                                <DropdownTrigger>
                                  <Button
                                    isIconOnly
                                    size="sm"
                                    variant="light"
                                    aria-label={`Menu da cobrança ${charge.title}`}
                                    isDisabled={updatingChargeStatusID === charge.id}
                                  >
                                    <MaterialSymbol name="more_vert" className="text-[20px]" />
                                  </Button>
                                </DropdownTrigger>
                                <DropdownMenu
                                  aria-label={`Ações da cobrança ${charge.title}`}
                                  onAction={(key) => {
                                    if (String(key) === "edit") {
                                      openChargeModal(charge);
                                    }
                                    if (String(key) === "edit-amount") {
                                      openChargeAmountModal(charge);
                                    }
                                    if (String(key) === "delete") {
                                      openChargeDeleteModal(charge);
                                    }
                                    if (String(key) === "mark-paid") {
                                      void handleUpdateChargeStatus(charge, "pago");
                                    }
                                    if (String(key) === "mark-cancelled") {
                                      void handleUpdateChargeStatus(charge, "cancelada");
                                    }
                                  }}
                                >
                                  <DropdownItem
                                    key="edit"
                                    startContent={
                                      <MaterialSymbol name="edit_note" className="text-[18px]" />
                                    }
                                  >
                                    Editar
                                  </DropdownItem>
                                  <DropdownItem
                                    key="edit-amount"
                                    startContent={
                                      <MaterialSymbol name="edit" className="text-[18px]" />
                                    }
                                  >
                                    Editar valor
                                  </DropdownItem>
                                  <DropdownItem
                                    key="delete"
                                    color="danger"
                                    startContent={
                                      <MaterialSymbol name="delete" className="text-[18px]" />
                                    }
                                  >
                                    Excluir
                                  </DropdownItem>
                                  <DropdownItem
                                    key="mark-paid"
                                    startContent={
                                      <MaterialSymbol name="payments" className="text-[18px]" />
                                    }
                                  >
                                    Pagar
                                  </DropdownItem>
                                  <DropdownItem
                                    key="mark-cancelled"
                                    color="danger"
                                    startContent={
                                      <MaterialSymbol name="cancel" className="text-[18px]" />
                                    }
                                  >
                                    Cancelar
                                  </DropdownItem>
                                </DropdownMenu>
                              </Dropdown>
                            ) : (
                              <span className="text-xs text-foreground/50">-</span>
                            )}
                          </td>
                        </tr>
                      ))
                    : null}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}

      <Modal
        isOpen={isProjectModalOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setIsProjectModalOpen(false);
            setEditingProjectID(null);
            setIsLoadingProjectModal(false);
            setProjectFormError(null);
            setProjectManagerSearchValue("");
          }
        }}
        size="5xl"
        scrollBehavior="inside"
        classNames={projectModalClassNames}
      >
        <ModalContent>
          {(closeModal) => (
            <form onSubmit={handleSubmitProject}>
              <ModalHeader>{editingProjectID ? "Editar projeto" : "Novo projeto"}</ModalHeader>
              <ModalBody className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
                {isLoadingProjectModal ? (
                  <p className="rounded-xl border border-default-200 bg-default-100 px-3 py-2 text-sm text-foreground/80">
                    Carregando dados do projeto...
                  </p>
                ) : null}

                <Input
                  value={projectForm.name}
                  onValueChange={(value) =>
                    setProjectForm((currentForm) => ({ ...currentForm, name: value }))
                  }
                  label="Nome do projeto"
                  isRequired
                />

                <label className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/60">
                  Objetivo do projeto
                </label>
                <textarea
                  value={projectForm.objective}
                  onChange={(event) =>
                    setProjectForm((currentForm) => ({
                      ...currentForm,
                      objective: event.target.value,
                    }))
                  }
                  rows={6}
                  className="min-h-[180px] w-full rounded-xl border border-default-200 bg-transparent px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
                  placeholder="Descreva o objetivo principal do projeto"
                />

                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/60">
                      Tipo de projeto
                    </label>
                    <select
                      value={projectForm.projectTypeId}
                      onChange={(event) =>
                        setProjectForm((currentForm) => ({
                          ...currentForm,
                          projectTypeId: event.target.value,
                        }))
                      }
                      className="mt-2 h-10 w-full rounded-xl border border-default-200 bg-transparent px-3 text-sm text-foreground outline-none transition-colors focus:border-primary"
                    >
                      <option value="">Sem tipo definido</option>
                      {projectTypes.map((projectType) => (
                        <option key={projectType.id} value={projectType.id}>
                          {projectType.categoryName} - {projectType.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/60">
                      Ciclo do projeto
                    </label>
                    <select
                      value={projectForm.lifecycleType}
                      onChange={(event) =>
                        setProjectForm((currentForm) => ({
                          ...currentForm,
                          lifecycleType: event.target.value as "temporario" | "recorrente",
                        }))
                      }
                      className="mt-2 h-10 w-full rounded-xl border border-default-200 bg-transparent px-3 text-sm text-foreground outline-none transition-colors focus:border-primary"
                    >
                      <option value="temporario">Temporário</option>
                      <option value="recorrente">Recorrente</option>
                    </select>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <Input
                    type="date"
                    value={projectForm.startDate}
                    onValueChange={(value) =>
                      setProjectForm((currentForm) => ({ ...currentForm, startDate: value }))
                    }
                    label="Data inicial"
                  />
                  <Input
                    type="date"
                    value={projectForm.endDate}
                    onValueChange={(value) =>
                      setProjectForm((currentForm) => ({ ...currentForm, endDate: value }))
                    }
                    label="Data final"
                  />
                </div>

                <label className="flex items-center gap-2 text-sm text-foreground/90">
                  <input
                    type="checkbox"
                    checked={projectForm.hasMonthlyMaintenance}
                    onChange={(event) =>
                      setProjectForm((currentForm) => ({
                        ...currentForm,
                        hasMonthlyMaintenance: event.target.checked,
                      }))
                    }
                    className="h-4 w-4 rounded border-default-300"
                  />
                  Projeto com manutenção mensal
                </label>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/60">
                    Gestores do projeto
                  </p>
                  <Input
                    value={projectManagerSearchValue}
                    onValueChange={setProjectManagerSearchValue}
                    placeholder="Pesquisar usuários por nome, login ou e-mail"
                    startContent={<MaterialSymbol name="search" className="text-[18px]" />}
                    className="mt-2"
                  />
                  <div className="mt-2 max-h-44 space-y-2 overflow-y-auto rounded-xl border border-default-200 p-3">
                    {filteredProjectManagerUsers.length === 0 ? (
                      <p className="text-sm text-foreground/70">
                        Nenhum usuário ativo encontrado.
                      </p>
                    ) : null}

                    {filteredProjectManagerUsers.map((user) => {
                      const isChecked = projectForm.managerUserIds.includes(user.id);

                      return (
                        <label
                          key={user.id}
                          className="flex items-center justify-between gap-3 rounded-lg bg-default-100/60 px-3 py-2 text-sm"
                        >
                          <span>
                            <strong className="text-foreground">{user.name}</strong>
                            <span className="ml-2 text-xs text-foreground/60">{user.login}</span>
                          </span>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(event) => {
                              setProjectForm((currentForm) => ({
                                ...currentForm,
                                managerUserIds: event.target.checked
                                  ? [...currentForm.managerUserIds, user.id]
                                  : currentForm.managerUserIds.filter(
                                      (managerUserID) => managerUserID !== user.id,
                                    ),
                              }));
                            }}
                            className="h-4 w-4 rounded border-default-300"
                          />
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/60">
                    Clientes vinculados ao projeto
                  </p>
                  <div className="mt-2 max-h-52 space-y-2 overflow-y-auto rounded-xl border border-default-200 p-3">
                    {clients.length === 0 ? (
                      <p className="text-sm text-foreground/70">
                        Nenhum cliente ativo encontrado.
                      </p>
                    ) : null}

                    {clients.map((client) => {
                      const isChecked = projectForm.clientIds.includes(client.id);

                      return (
                        <label
                          key={client.id}
                          className="flex items-center justify-between gap-3 rounded-lg bg-default-100/60 px-3 py-2 text-sm"
                        >
                          <span>
                            <strong className="text-foreground">{client.name}</strong>
                            <span className="ml-2 text-xs text-foreground/60">{client.login}</span>
                          </span>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(event) => {
                              setProjectForm((currentForm) => ({
                                ...currentForm,
                                clientIds: event.target.checked
                                  ? [...currentForm.clientIds, client.id]
                                  : currentForm.clientIds.filter(
                                      (clientId) => clientId !== client.id,
                                    ),
                              }));
                            }}
                            className="h-4 w-4 rounded border-default-300"
                          />
                        </label>
                      );
                    })}
                  </div>
                </div>

                {projectFormError ? (
                  <p className="rounded-xl border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
                    {projectFormError}
                  </p>
                ) : null}
              </ModalBody>
              <ModalFooter>
                <Button
                  variant="flat"
                  startContent={<MaterialSymbol name="close" className="text-[18px]" />}
                  onPress={() => {
                    closeModal();
                    setIsProjectModalOpen(false);
                    setEditingProjectID(null);
                    setIsLoadingProjectModal(false);
                    setProjectFormError(null);
                    setProjectManagerSearchValue("");
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  color="primary"
                  type="submit"
                  isLoading={isSavingProject || isLoadingProjectModal}
                  isDisabled={isLoadingProjectModal}
                  startContent={<MaterialSymbol name="save" className="text-[18px]" />}
                >
                  {editingProjectID ? "Salvar alterações" : "Salvar projeto"}
                </Button>
              </ModalFooter>
            </form>
          )}
        </ModalContent>
      </Modal>

      <Modal
        isOpen={isProjectTypeModalOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setIsProjectTypeModalOpen(false);
          }
        }}
        size="3xl"
        classNames={projectTypeModalClassNames}
      >
        <ModalContent>
          {(closeModal) => (
            <form onSubmit={handleSubmitProjectType}>
              <ModalHeader>Novo tipo de projeto</ModalHeader>
              <ModalBody className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/60">
                    Categoria
                  </label>
                  <select
                    value={projectTypeForm.categoryId}
                    onChange={(event) =>
                      setProjectTypeForm((currentForm) => ({
                        ...currentForm,
                        categoryId: event.target.value,
                      }))
                    }
                    className="mt-2 h-10 w-full rounded-xl border border-default-200 bg-transparent px-3 text-sm text-foreground outline-none transition-colors focus:border-primary"
                  >
                    <option value="">Selecione uma categoria</option>
                    {projectCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <Input
                    value={projectTypeForm.code}
                    onValueChange={(value) =>
                      setProjectTypeForm((currentForm) => ({
                        ...currentForm,
                        code: value,
                      }))
                    }
                    label="Código"
                    isRequired
                  />
                  <Input
                    value={projectTypeForm.name}
                    onValueChange={(value) =>
                      setProjectTypeForm((currentForm) => ({
                        ...currentForm,
                        name: value,
                      }))
                    }
                    label="Nome"
                    isRequired
                  />
                </div>

                <Input
                  value={projectTypeForm.description}
                  onValueChange={(value) =>
                    setProjectTypeForm((currentForm) => ({
                      ...currentForm,
                      description: value,
                    }))
                  }
                  label="Descrição"
                />

                {projectTypeFormError ? (
                  <p className="rounded-xl border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
                    {projectTypeFormError}
                  </p>
                ) : null}
              </ModalBody>
              <ModalFooter>
                <Button
                  variant="flat"
                  startContent={<MaterialSymbol name="close" className="text-[18px]" />}
                  onPress={() => {
                    closeModal();
                    setIsProjectTypeModalOpen(false);
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  color="primary"
                  type="submit"
                  isLoading={isSavingProjectType}
                  startContent={<MaterialSymbol name="save" className="text-[18px]" />}
                >
                  Salvar tipo
                </Button>
              </ModalFooter>
            </form>
          )}
        </ModalContent>
      </Modal>

      <Modal
        isOpen={isRevenueModalOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setIsRevenueModalOpen(false);
          }
        }}
        size="4xl"
        scrollBehavior="inside"
        classNames={revenueModalClassNames}
      >
        <ModalContent>
          {(closeModal) => (
            <form onSubmit={handleSubmitRevenue}>
              <ModalHeader>Nova receita</ModalHeader>
              <ModalBody className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/60">
                    Projeto
                  </label>
                  <select
                    value={revenueForm.projectId}
                    onChange={(event) =>
                      setRevenueForm((currentForm) => ({
                        ...currentForm,
                        projectId: event.target.value,
                      }))
                    }
                    className="mt-2 h-10 w-full rounded-xl border border-default-200 bg-transparent px-3 text-sm text-foreground outline-none transition-colors focus:border-primary"
                  >
                    <option value="">Selecione um projeto</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <Input
                    value={revenueForm.title}
                    onValueChange={(value) =>
                      setRevenueForm((currentForm) => ({ ...currentForm, title: value }))
                    }
                    label="Título"
                    isRequired
                  />
                  <Input
                    value={revenueForm.amount}
                    onValueChange={(value) =>
                      setRevenueForm((currentForm) => ({ ...currentForm, amount: value }))
                    }
                    label="Valor"
                    placeholder="0.00"
                    isRequired
                  />
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <Input
                    type="date"
                    value={revenueForm.expectedOn}
                    onValueChange={(value) =>
                      setRevenueForm((currentForm) => ({ ...currentForm, expectedOn: value }))
                    }
                    label="Previsto para"
                  />
                  <Input
                    type="date"
                    value={revenueForm.receivedOn}
                    onValueChange={(value) =>
                      setRevenueForm((currentForm) => ({ ...currentForm, receivedOn: value }))
                    }
                    label="Recebido em"
                  />
                </div>

                <Input
                  value={revenueForm.objective}
                  onValueChange={(value) =>
                    setRevenueForm((currentForm) => ({ ...currentForm, objective: value }))
                  }
                  label="Objetivo"
                />

                <Input
                  value={revenueForm.description}
                  onValueChange={(value) =>
                    setRevenueForm((currentForm) => ({ ...currentForm, description: value }))
                  }
                  label="Descrição"
                />

                <div className="rounded-xl border border-default-200 p-3">
                  <p className="text-sm font-medium text-foreground">
                    Comprovantes de recebimento
                  </p>
                  <input
                    ref={revenueReceiptFileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleRevenueReceiptFileInputChange}
                  />
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => revenueReceiptFileInputRef.current?.click()}
                    onKeyDown={handleRevenueReceiptAreaKeyDown}
                    onPaste={handleRevenueReceiptPaste}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={handleRevenueReceiptDrop}
                    className="mt-3 rounded-xl border border-dashed border-default-300 bg-default-50/60 px-4 py-6 text-center outline-none transition-colors hover:border-primary focus-visible:border-primary"
                  >
                    <MaterialSymbol
                      name="upload_file"
                      className="text-[32px] text-primary"
                    />
                    <p className="mt-2 text-sm font-semibold text-foreground">
                      Cole, arraste ou clique para subir um arquivo
                    </p>
                    <p className="mt-1 text-xs text-foreground/70">
                      Use Ctrl/Cmd + V para colar um arquivo da área de transferência.
                    </p>
                    {revenueForm.receipts[0] ? (
                      <p className="mt-3 truncate text-xs font-medium text-foreground">
                        {revenueForm.receipts[0].fileName}
                      </p>
                    ) : null}
                  </div>

                  {revenueForm.receipts[0] ? (
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-default-100/70 px-3 py-2">
                      <p className="text-xs text-foreground/70">
                        Tipo: {revenueForm.receipts[0].contentType || "não informado"}
                      </p>
                      <Button
                        type="button"
                        size="sm"
                        variant="flat"
                        color="danger"
                        startContent={<MaterialSymbol name="delete" className="text-[16px]" />}
                        onPress={clearRevenueReceiptFile}
                      >
                        Remover arquivo
                      </Button>
                    </div>
                  ) : null}
                </div>

                {revenueFormError ? (
                  <p className="rounded-xl border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
                    {revenueFormError}
                  </p>
                ) : null}
              </ModalBody>
              <ModalFooter>
                <Button
                  variant="flat"
                  startContent={<MaterialSymbol name="close" className="text-[18px]" />}
                  onPress={() => {
                    closeModal();
                    setIsRevenueModalOpen(false);
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  color="primary"
                  type="submit"
                  isLoading={isSavingRevenue}
                  startContent={<MaterialSymbol name="save" className="text-[18px]" />}
                >
                  Salvar receita
                </Button>
              </ModalFooter>
            </form>
          )}
        </ModalContent>
      </Modal>

      <Modal
        isOpen={isRevenueReceiptModalOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            closeRevenueReceiptModal();
          }
        }}
        size="5xl"
        scrollBehavior="inside"
        classNames={wideModalClassNames}
      >
        <ModalContent>
          {(closeModal) => (
            <>
              <ModalHeader>Comprovante</ModalHeader>
              <ModalBody className="space-y-3">
                <p className="text-sm text-foreground/80">
                  {selectedRevenueReceipt?.fileName || selectedRevenueReceipt?.fileKey || "-"}
                </p>
                {selectedRevenueReceipt?.fileKey ? (
                  <iframe
                    title={selectedRevenueReceipt.fileName || "Comprovante"}
                    src={selectedRevenueReceipt.fileKey}
                    className="h-[68vh] w-full rounded-xl border border-default-200"
                  />
                ) : (
                  <p className="rounded-xl border border-default-200 bg-default-100/70 px-3 py-2 text-sm text-foreground/70">
                    Link do comprovante não informado.
                  </p>
                )}
              </ModalBody>
              <ModalFooter>
                <Button
                  variant="flat"
                  startContent={<MaterialSymbol name="close" className="text-[18px]" />}
                  onPress={() => {
                    closeModal();
                    closeRevenueReceiptModal();
                  }}
                >
                  Fechar
                </Button>
                <Button
                  as="a"
                  color="primary"
                  target="_blank"
                  rel="noreferrer"
                  href={selectedRevenueReceipt?.fileKey || "#"}
                  isDisabled={!selectedRevenueReceipt?.fileKey}
                  startContent={<MaterialSymbol name="open_in_new" className="text-[18px]" />}
                >
                  Abrir em nova aba
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      <Modal
        isOpen={isRevenueCancelModalOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen && !isCancellingRevenue) {
            closeRevenueCancelModal();
          }
        }}
        size="2xl"
        classNames={projectTypeModalClassNames}
      >
        <ModalContent>
          {(closeModal) => (
            <>
              <ModalHeader>Cancelar receita</ModalHeader>
              <ModalBody className="space-y-4">
                <p className="rounded-xl border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-foreground/80">
                  Tem certeza que deseja cancelar a receita{" "}
                  <strong>{revenueToCancel?.title || "-"}</strong>?
                </p>

                {revenueCancelError ? (
                  <p className="rounded-xl border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
                    {revenueCancelError}
                  </p>
                ) : null}
              </ModalBody>
              <ModalFooter>
                <Button
                  variant="flat"
                  isDisabled={isCancellingRevenue}
                  startContent={<MaterialSymbol name="close" className="text-[18px]" />}
                  onPress={() => {
                    closeModal();
                    closeRevenueCancelModal();
                  }}
                >
                  Fechar
                </Button>
                <Button
                  color="danger"
                  isLoading={isCancellingRevenue}
                  startContent={<MaterialSymbol name="cancel" className="text-[18px]" />}
                  onPress={() => {
                    void handleCancelRevenue();
                  }}
                >
                  Confirmar cancelamento
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      <Modal
        isOpen={isProjectStatusModalOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen && !isUpdatingProjectStatus) {
            closeProjectStatusModal();
          }
        }}
        size="2xl"
        classNames={projectTypeModalClassNames}
      >
        <ModalContent>
          {(closeModal) => {
            const isCancelAction = projectStatusModalContext?.nextStatus === "cancelado";

            return (
              <>
                <ModalHeader>
                  {isCancelAction ? "Cancelar projeto" : "Concluir projeto"}
                </ModalHeader>
                <ModalBody className="space-y-4">
                  <p className="rounded-xl border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-foreground/85">
                    Tem certeza que deseja {isCancelAction ? "cancelar" : "concluir"} o projeto{" "}
                    <strong>{projectStatusModalContext?.project.name || "-"}</strong>
                    {isCancelAction ? "? Isso também cancelará fases e tarefas." : "?"}
                  </p>

                  {projectStatusModalError ? (
                    <p className="rounded-xl border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
                      {projectStatusModalError}
                    </p>
                  ) : null}
                </ModalBody>
                <ModalFooter>
                  <Button
                    variant="flat"
                    isDisabled={isUpdatingProjectStatus}
                    startContent={<MaterialSymbol name="close" className="text-[18px]" />}
                    onPress={() => {
                      closeModal();
                      closeProjectStatusModal();
                    }}
                  >
                    Fechar
                  </Button>
                  <Button
                    color={isCancelAction ? "danger" : "primary"}
                    isLoading={isUpdatingProjectStatus}
                    startContent={
                      <MaterialSymbol
                        name={isCancelAction ? "cancel" : "task_alt"}
                        className="text-[18px]"
                      />
                    }
                    onPress={() => {
                      void handleUpdateProjectStatus();
                    }}
                  >
                    {isCancelAction ? "Confirmar cancelamento" : "Confirmar conclusão"}
                  </Button>
                </ModalFooter>
              </>
            );
          }}
        </ModalContent>
      </Modal>

      <Modal
        isOpen={isChargeModalOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setIsChargeModalOpen(false);
            setEditingChargeID(null);
            setChargeFormError(null);
          }
        }}
        size="3xl"
        classNames={chargeModalClassNames}
      >
        <ModalContent>
          {(closeModal) => (
            <form onSubmit={handleSubmitCharge}>
              <ModalHeader>
                {editingChargeID ? "Editar cobrança mensal" : "Nova cobrança mensal"}
              </ModalHeader>
              <ModalBody className="space-y-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/60">
                    Projeto
                  </label>
                  <select
                    value={chargeForm.projectId}
                    onChange={(event) =>
                      setChargeForm((currentForm) => ({
                        ...currentForm,
                        projectId: event.target.value,
                      }))
                    }
                    disabled={Boolean(editingChargeID)}
                    className="mt-2 h-10 w-full rounded-xl border border-default-200 bg-transparent px-3 text-sm text-foreground outline-none transition-colors focus:border-primary"
                  >
                    <option value="">Selecione um projeto</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>

                <Input
                  value={chargeForm.title}
                  onValueChange={(value) =>
                    setChargeForm((currentForm) => ({ ...currentForm, title: value }))
                  }
                  label="Título"
                  isRequired
                />

                <div className="grid gap-3 md:grid-cols-3">
                  <Input
                    value={chargeForm.amount}
                    onValueChange={(value) =>
                      setChargeForm((currentForm) => ({ ...currentForm, amount: value }))
                    }
                    label="Valor"
                    placeholder="0.00"
                    isRequired
                  />
                  <Input
                    value={chargeForm.dueDay}
                    onValueChange={(value) =>
                      setChargeForm((currentForm) => ({ ...currentForm, dueDay: value }))
                    }
                    label="Dia de vencimento"
                    placeholder="1"
                    isRequired
                  />
                  <Input
                    value={chargeForm.installment}
                    onValueChange={(value) =>
                      setChargeForm((currentForm) => ({ ...currentForm, installment: value }))
                    }
                    label="Parcela"
                    placeholder="Ex: 1/12"
                  />
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <Input
                    type="date"
                    value={chargeForm.startsOn}
                    onValueChange={(value) =>
                      setChargeForm((currentForm) => ({ ...currentForm, startsOn: value }))
                    }
                    label="Início"
                  />
                  <Input
                    type="date"
                    value={chargeForm.endsOn}
                    onValueChange={(value) =>
                      setChargeForm((currentForm) => ({ ...currentForm, endsOn: value }))
                    }
                    label="Fim"
                  />
                </div>

                <Input
                  value={chargeForm.description}
                  onValueChange={(value) =>
                    setChargeForm((currentForm) => ({
                      ...currentForm,
                      description: value,
                    }))
                  }
                  label="Descrição"
                />

                {chargeFormError ? (
                  <p className="rounded-xl border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
                    {chargeFormError}
                  </p>
                ) : null}
              </ModalBody>
              <ModalFooter>
                <Button
                  variant="flat"
                  startContent={<MaterialSymbol name="close" className="text-[18px]" />}
                  onPress={() => {
                    closeModal();
                    setIsChargeModalOpen(false);
                    setEditingChargeID(null);
                    setChargeFormError(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  color="primary"
                  type="submit"
                  isLoading={isSavingCharge}
                  startContent={<MaterialSymbol name="save" className="text-[18px]" />}
                >
                  {editingChargeID ? "Salvar alterações" : "Salvar cobrança"}
                </Button>
              </ModalFooter>
            </form>
          )}
        </ModalContent>
      </Modal>

      <Modal
        isOpen={isChargeAmountModalOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setIsChargeAmountModalOpen(false);
            setEditingCharge(null);
            setChargeAmountFormValue("");
            setChargeAmountFormError(null);
          }
        }}
        size="2xl"
        classNames={projectTypeModalClassNames}
      >
        <ModalContent>
          {(closeModal) => (
            <form onSubmit={handleSubmitChargeAmount}>
              <ModalHeader>Editar valor da cobrança</ModalHeader>
              <ModalBody className="space-y-4">
                <p className="rounded-xl border border-default-200 bg-default-100/70 px-3 py-2 text-sm text-foreground/80">
                  {editingCharge?.title || "-"}
                  {editingCharge?.installment
                    ? ` | Parcela: ${editingCharge.installment}`
                    : ""}
                </p>

                <Input
                  value={chargeAmountFormValue}
                  onValueChange={setChargeAmountFormValue}
                  label="Valor"
                  placeholder="0.00"
                  isRequired
                />

                {chargeAmountFormError ? (
                  <p className="rounded-xl border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
                    {chargeAmountFormError}
                  </p>
                ) : null}
              </ModalBody>
              <ModalFooter>
                <Button
                  variant="flat"
                  startContent={<MaterialSymbol name="close" className="text-[18px]" />}
                  onPress={() => {
                    closeModal();
                    setIsChargeAmountModalOpen(false);
                    setEditingCharge(null);
                    setChargeAmountFormValue("");
                    setChargeAmountFormError(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  color="primary"
                  type="submit"
                  isLoading={isSavingChargeAmount}
                  startContent={<MaterialSymbol name="save" className="text-[18px]" />}
                >
                  Salvar valor
                </Button>
              </ModalFooter>
            </form>
          )}
        </ModalContent>
      </Modal>

      <Modal
        isOpen={isChargeDeleteModalOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen && !isDeletingCharge) {
            closeChargeDeleteModal();
          }
        }}
        size="2xl"
        classNames={projectTypeModalClassNames}
      >
        <ModalContent>
          {(closeModal) => (
            <>
              <ModalHeader>Excluir cobrança mensal</ModalHeader>
              <ModalBody className="space-y-4">
                <p className="rounded-xl border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-foreground/80">
                  Tem certeza que deseja excluir a cobrança{" "}
                  <strong>{chargeToDelete?.title || "-"}</strong>?
                </p>

                {chargeDeleteError ? (
                  <p className="rounded-xl border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
                    {chargeDeleteError}
                  </p>
                ) : null}
              </ModalBody>
              <ModalFooter>
                <Button
                  variant="flat"
                  isDisabled={isDeletingCharge}
                  startContent={<MaterialSymbol name="close" className="text-[18px]" />}
                  onPress={() => {
                    closeModal();
                    closeChargeDeleteModal();
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  color="danger"
                  isLoading={isDeletingCharge}
                  startContent={<MaterialSymbol name="delete" className="text-[18px]" />}
                  onPress={() => {
                    void handleDeleteCharge();
                  }}
                >
                  Excluir
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      <Modal
        isOpen={isRoadmapModalOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setIsRoadmapModalOpen(false);
            setIsPhaseModalOpen(false);
            setIsSubPhaseModalOpen(false);
            setIsTaskModalOpen(false);
            closeTaskCommentsModal();
            setEditingPhase(null);
            setEditingSubPhase(null);
            setEditingTask(null);
            setIsRefreshingRoadmap(false);
            setIsRecalculatingRoadmap(false);
            setIsExportingRoadmapPdf(false);
            handleCloseExportModal();
            setRoadmapProject(null);
            setRoadmapError(null);
          }
        }}
        size="5xl"
        scrollBehavior="inside"
        classNames={wideModalClassNames}
      >
        <ModalContent>
          {(closeModal) => (
            <>
              <ModalHeader>
                {roadmapProject ? `Fases e tarefas: ${roadmapProject.name}` : "Fases e tarefas"}
              </ModalHeader>
              <ModalBody className="space-y-4">
                {isLoadingRoadmap ? <p className="text-sm text-foreground/70">Carregando...</p> : null}

                {!isLoadingRoadmap && roadmapError ? (
                  <p className="rounded-xl border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
                    {roadmapError}
                  </p>
                ) : null}

                {!isLoadingRoadmap && roadmapProject ? (
                  <>
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-default-200 bg-content1/70 p-4">
                      <div>
                        <p className="text-sm font-semibold text-foreground">Planejamento</p>
                        <p className="text-xs text-foreground/70">
                          Visualize fases e tarefas e adicione novas fases do projeto.
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1 rounded-full border border-default-300 bg-default-100 px-2.5 py-1 text-xs font-medium text-foreground/80">
                            <MaterialSymbol name="calendar_month" className="text-[14px]" />
                            Período: {formatDate(roadmapProject.startDate)} até{" "}
                            {formatDate(roadmapProject.endDate)}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${getProgressBadgeClassName(
                              planningProgress.projectPercent,
                            )}`}
                          >
                            <MaterialSymbol name="check_circle" className="text-[14px]" />
                            Concluído: {formatPercent(planningProgress.projectPercent)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Tooltip content="Exportar PDF do projeto" placement="top">
                          <Button
                            isIconOnly
                            variant="flat"
                            color="danger"
                            aria-label="Exportar PDF do projeto"
                            onPress={() => {
                              openExportModalAndGeneratePdf();
                            }}
                            isDisabled={
                              isLoadingRoadmap ||
                              isRefreshingRoadmap ||
                              isRecalculatingRoadmap ||
                              !roadmapProject
                            }
                          >
                            <MaterialSymbol name="picture_as_pdf" className="text-[18px]" />
                          </Button>
                        </Tooltip>
                        <Tooltip content="Recalcular projeto" placement="top">
                          <Button
                            isIconOnly
                            color="warning"
                            variant="flat"
                            aria-label="Recalcular projeto"
                            onPress={() => {
                              void handleRecalculateProjectTimeline();
                            }}
                            isLoading={isRecalculatingRoadmap}
                            isDisabled={isLoadingRoadmap || isRefreshingRoadmap}
                          >
                            <MaterialSymbol name="calculate" className="text-[18px]" />
                          </Button>
                        </Tooltip>
                        <Tooltip content="Atualizar" placement="top">
                          <Button
                            isIconOnly
                            variant="flat"
                            aria-label="Atualizar"
                            onPress={() => {
                              void handleRefreshRoadmap();
                            }}
                            isLoading={isRefreshingRoadmap}
                            isDisabled={isLoadingRoadmap || isRecalculatingRoadmap}
                          >
                            <MaterialSymbol name="refresh" className="text-[18px]" />
                          </Button>
                        </Tooltip>
                        <Tooltip content="Adicionar fase" placement="top">
                          <Button
                            isIconOnly
                            color="primary"
                            aria-label="Adicionar fase"
                            onPress={() => {
                              openPhaseModal();
                            }}
                            isDisabled={isRecalculatingRoadmap || isRefreshingRoadmap}
                          >
                            <MaterialSymbol name="add" className="text-[18px]" />
                          </Button>
                        </Tooltip>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-default-200 p-4">
                      <p className="text-sm font-semibold text-foreground">Fases e tarefas</p>
                      <div className="mt-3 max-h-[52vh] overflow-auto">
                        <table className="min-w-full text-left text-sm">
                          <thead className="bg-content1/70">
                            <tr className="border-b border-default-200">
                              <th className="px-3 py-2 font-semibold text-foreground/80">Título</th>
                              <th className="px-3 py-2 font-semibold text-foreground/80">
                                Data inicial
                              </th>
                              <th className="px-3 py-2 font-semibold text-foreground/80">
                                Data final
                              </th>
                              <th className="px-3 py-2 text-center font-semibold text-foreground/80">
                                Concluído
                              </th>
                              <th className="px-3 py-2 text-right font-semibold text-foreground/80">
                                Menu
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {planningRows.length === 0 ? (
                              <tr>
                                <td className="px-3 py-4 text-foreground/70" colSpan={5}>
                                  Nenhuma fase ou tarefa cadastrada.
                                </td>
                              </tr>
                            ) : null}

                            {planningRows.map((row) => {
                              const paddingClassName =
                                row.level === 0
                                  ? "pl-1"
                                  : row.level === 1
                                    ? "pl-6"
                                    : "pl-10";

                              return (
                                <tr
                                  key={row.key}
                                  className="border-b border-default-200/70 last:border-b-0"
                                >
                                  <td className="px-3 py-2 text-foreground">
                                    <div className={`flex items-start gap-3 ${paddingClassName}`}>
                                      <span
                                        className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${row.iconClassName}`}
                                      >
                                        {row.iconLabel}
                                      </span>
                                      <div>
                                        <p
                                          className={
                                            row.kind === "phase"
                                              ? "font-semibold"
                                              : row.kind === "subphase"
                                                ? "font-medium"
                                                : "font-normal"
                                          }
                                        >
                                          {row.title}
                                        </p>
                                        <p className="text-xs text-foreground/60">
                                          {row.description || "-"}
                                        </p>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-3 py-2 text-foreground/80">
                                    {formatDate(row.startsOn)}
                                  </td>
                                  <td className="px-3 py-2 text-foreground/80">
                                    {formatDate(row.endsOn)}
                                  </td>
                                  <td className="px-3 py-2 text-center">
                                    {row.kind === "task" &&
                                    row.taskRef &&
                                    isTaskCancelled(row.taskRef.status) ? (
                                      <span className="inline-flex min-w-[70px] justify-center rounded-full border border-danger/40 bg-danger/10 px-2 py-1 text-xs font-semibold text-danger">
                                        Cancelada
                                      </span>
                                    ) : (
                                      <span
                                        className={`inline-flex min-w-[70px] justify-center rounded-full border px-2 py-1 text-xs font-semibold ${getProgressBadgeClassName(
                                          row.progressPercent,
                                        )}`}
                                      >
                                        {formatPercent(row.progressPercent)}
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-3 py-2 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      {row.kind === "task" && row.taskRef ? (
                                        <Button
                                          size="sm"
                                          variant="flat"
                                          startContent={
                                            <MaterialSymbol name="comment" className="text-[16px]" />
                                          }
                                          onPress={() =>
                                            openTaskCommentsModal(
                                              row.phaseRef,
                                              row.subPhaseRef,
                                              row.taskRef as ProjectTask,
                                            )
                                          }
                                        >
                                          Comentários
                                        </Button>
                                      ) : null}
                                      <Dropdown placement="bottom-end">
                                        <DropdownTrigger>
                                          <Button
                                            isIconOnly
                                            size="sm"
                                            variant="light"
                                            aria-label={`Menu de ${row.title}`}
                                          >
                                            <MaterialSymbol
                                              name="more_vert"
                                              className="text-[20px]"
                                            />
                                          </Button>
                                        </DropdownTrigger>
                                        <DropdownMenu
                                          aria-label={`Ações de ${row.title}`}
                                          onAction={(key) => {
                                            const action = String(key);
                                            if (row.kind === "phase") {
                                              if (action === "edit") {
                                                openPhaseModal(row.phaseRef);
                                                return;
                                              }
                                              if (action === "add-subphase") {
                                                openSubPhaseModal(row.phaseRef);
                                                return;
                                              }
                                              if (action === "add-task") {
                                                openTaskModal(row.phaseRef, null);
                                                return;
                                              }
                                              if (action === "delete") {
                                                handleDeletePlaceholder("fase");
                                              }
                                              return;
                                            }

                                            if (row.kind === "subphase") {
                                              if (action === "edit" && row.subPhaseRef) {
                                                openSubPhaseModal(row.phaseRef, row.subPhaseRef);
                                                return;
                                              }
                                              if (action === "add-task") {
                                                openTaskModal(row.phaseRef, row.subPhaseRef);
                                                return;
                                              }
                                              if (action === "delete") {
                                                handleDeletePlaceholder("sub-fase");
                                              }
                                              return;
                                            }

                                            if (row.kind === "task") {
                                              if (action === "edit" && row.taskRef) {
                                                openTaskModal(row.phaseRef, row.subPhaseRef, row.taskRef);
                                                return;
                                              }
                                              if (action === "delete") {
                                                handleDeletePlaceholder("tarefa");
                                              }
                                            }
                                          }}
                                        >
                                          {row.kind === "phase" ? (
                                            <>
                                              <DropdownItem
                                                key="edit"
                                                startContent={
                                                  <MaterialSymbol name="edit" className="text-[18px]" />
                                                }
                                              >
                                                Editar
                                              </DropdownItem>
                                              <DropdownItem
                                                key="add-subphase"
                                                startContent={
                                                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-success-100 text-[10px] font-bold text-success-700">
                                                    S
                                                  </span>
                                                }
                                              >
                                                Sub-fase
                                              </DropdownItem>
                                              <DropdownItem
                                                key="add-task"
                                                startContent={
                                                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-warning-100 text-[10px] font-bold text-warning-700">
                                                    T
                                                  </span>
                                                }
                                              >
                                                Tarefa
                                              </DropdownItem>
                                              <DropdownItem
                                                key="delete"
                                                color="danger"
                                                className="text-danger"
                                                startContent={
                                                  <MaterialSymbol
                                                    name="delete"
                                                    className="text-[18px]"
                                                  />
                                                }
                                              >
                                                Excluir
                                              </DropdownItem>
                                            </>
                                          ) : null}

                                          {row.kind === "subphase" ? (
                                            <>
                                              <DropdownItem
                                                key="edit"
                                                startContent={
                                                  <MaterialSymbol name="edit" className="text-[18px]" />
                                                }
                                              >
                                                Editar
                                              </DropdownItem>
                                              <DropdownItem
                                                key="add-task"
                                                startContent={
                                                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-warning-100 text-[10px] font-bold text-warning-700">
                                                    T
                                                  </span>
                                                }
                                              >
                                                Tarefa
                                              </DropdownItem>
                                              <DropdownItem
                                                key="delete"
                                                color="danger"
                                                className="text-danger"
                                                startContent={
                                                  <MaterialSymbol
                                                    name="delete"
                                                    className="text-[18px]"
                                                  />
                                                }
                                              >
                                                Excluir
                                              </DropdownItem>
                                            </>
                                          ) : null}

                                          {row.kind === "task" ? (
                                            <>
                                              <DropdownItem
                                                key="edit"
                                                startContent={
                                                  <MaterialSymbol name="edit" className="text-[18px]" />
                                                }
                                              >
                                                Editar
                                              </DropdownItem>
                                              <DropdownItem
                                                key="delete"
                                                color="danger"
                                                className="text-danger"
                                                startContent={
                                                  <MaterialSymbol
                                                    name="delete"
                                                    className="text-[18px]"
                                                  />
                                                }
                                              >
                                                Excluir
                                              </DropdownItem>
                                            </>
                                          ) : null}
                                        </DropdownMenu>
                                      </Dropdown>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                ) : null}
              </ModalBody>
              <ModalFooter>
                <Button
                  variant="flat"
                  startContent={<MaterialSymbol name="close" className="text-[18px]" />}
                  onPress={() => {
                    closeModal();
                    setIsRoadmapModalOpen(false);
                    setIsPhaseModalOpen(false);
                    setIsSubPhaseModalOpen(false);
                    setIsTaskModalOpen(false);
                    closeTaskCommentsModal();
                    setEditingPhase(null);
                    setEditingSubPhase(null);
                    setEditingTask(null);
                    setIsExportingRoadmapPdf(false);
                    handleCloseExportModal();
                    setRoadmapProject(null);
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
        isOpen={isTaskCommentsModalOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen && !isSavingTaskComment) {
            closeTaskCommentsModal();
          }
        }}
        size="5xl"
        scrollBehavior="inside"
        classNames={wideModalClassNames}
      >
        <ModalContent>
          {(closeModal) => (
            <form onSubmit={handleSubmitTaskComment}>
              <ModalHeader>Comentários da tarefa</ModalHeader>
              <ModalBody className="space-y-4">
                <p className="rounded-lg bg-default-100/70 px-3 py-2 text-xs text-foreground/70">
                  {taskCommentModalContext
                    ? `${taskCommentModalContext.task.name} | ${buildTaskBreadcrumb(
                        taskCommentModalContext.phase,
                        taskCommentModalContext.subPhase,
                      )}`
                    : "-"}
                </p>

                <div className="rounded-xl border border-default-200 p-3">
                  <p className="text-sm font-semibold text-foreground">Histórico de comentários</p>
                  <div className="mt-3 max-h-[40vh] space-y-2 overflow-y-auto pr-1">
                    {isLoadingTaskComments ? (
                      <p className="text-sm text-foreground/70">Carregando comentários...</p>
                    ) : null}

                    {!isLoadingTaskComments && flattenedTaskComments.length === 0 ? (
                      <p className="text-sm text-foreground/70">
                        Nenhum comentário cadastrado para esta tarefa.
                      </p>
                    ) : null}

                    {!isLoadingTaskComments
                      ? flattenedTaskComments.map((threadItem) => (
                          <div
                            key={threadItem.comment.id}
                            className="rounded-xl border border-default-200 bg-content1 p-3"
                            style={{ marginLeft: `${Math.min(threadItem.depth, 6) * 20}px` }}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="space-y-1 text-left">
                                <div className="flex items-center gap-2">
                                  <MaterialSymbol
                                    name={getTaskCommentAuthorIconName(threadItem.comment)}
                                    className="text-[16px] text-foreground/70"
                                  />
                                  <p className="text-xs font-semibold text-foreground/80">
                                    {getTaskCommentAuthorName(threadItem.comment)}
                                  </p>
                                  <span className="rounded-full border border-default-300 bg-default-100 px-2 py-0.5 text-[10px] font-medium text-foreground/70">
                                    {getTaskCommentAuthorRoleLabel(threadItem.comment)}
                                  </span>
                                </div>
                                <p className="text-xs text-foreground/60">
                                  {formatDateTime(threadItem.comment.created)}
                                </p>
                              </div>
                              <Button
                                type="button"
                                size="sm"
                                variant="light"
                                onPress={() => handleStartReplyToComment(threadItem.comment)}
                              >
                                Responder
                              </Button>
                            </div>
                            <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">
                              {threadItem.comment.comment || "-"}
                            </p>
                            {threadItem.comment.files.length > 0 ? (
                              <div className="mt-2 space-y-1">
                                {threadItem.comment.files.map((file, index) => (
                                  <p
                                    key={`${threadItem.comment.id}-file-${index}`}
                                    className="text-xs text-foreground/70"
                                  >
                                    Arquivo: {file.fileName || file.fileKey || "-"}
                                  </p>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        ))
                      : null}
                  </div>
                </div>

                {replyTargetComment ? (
                  <div className="flex items-center justify-between gap-2 rounded-xl border border-primary/30 bg-primary/10 px-3 py-2">
                    <p className="truncate text-xs text-foreground/80">
                      Respondendo comentário: {replyTargetComment.comment}
                    </p>
                    <Button type="button" size="sm" variant="light" onPress={handleClearReplyTarget}>
                      Limpar resposta
                    </Button>
                  </div>
                ) : null}

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/60">
                    Novo comentário
                  </label>
                  <textarea
                    ref={taskCommentTextareaRef}
                    value={taskCommentForm.comment}
                    onChange={(event) =>
                      setTaskCommentForm((currentForm) => ({
                        ...currentForm,
                        comment: event.target.value,
                      }))
                    }
                    rows={4}
                    className="w-full rounded-xl border border-default-200 bg-transparent px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
                    placeholder="Descreva o comentário da tarefa"
                  />
                </div>

                <div className="rounded-xl border border-default-200 p-3">
                  <p className="text-sm font-medium text-foreground">Arquivo do comentário</p>
                  <input
                    ref={taskCommentFileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleTaskCommentFileInputChange}
                  />
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => taskCommentFileInputRef.current?.click()}
                    onKeyDown={handleTaskCommentAreaKeyDown}
                    onPaste={handleTaskCommentPaste}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={handleTaskCommentDrop}
                    className="mt-3 rounded-xl border border-dashed border-default-300 bg-default-50/60 px-4 py-6 text-center outline-none transition-colors hover:border-primary focus-visible:border-primary"
                  >
                    <MaterialSymbol name="upload_file" className="text-[28px] text-primary" />
                    <p className="mt-2 text-sm font-semibold text-foreground">
                      Cole, arraste ou clique para subir um arquivo
                    </p>
                    {taskCommentForm.files[0] ? (
                      <p className="mt-2 truncate text-xs text-foreground/70">
                        {taskCommentForm.files[0].fileName}
                      </p>
                    ) : null}
                  </div>

                  {taskCommentForm.files[0] ? (
                    <div className="mt-3 flex justify-end">
                      <Button
                        type="button"
                        size="sm"
                        variant="flat"
                        color="danger"
                        startContent={<MaterialSymbol name="delete" className="text-[16px]" />}
                        onPress={clearTaskCommentFile}
                      >
                        Remover arquivo
                      </Button>
                    </div>
                  ) : null}
                </div>

                {taskCommentsError ? (
                  <p className="rounded-xl border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
                    {taskCommentsError}
                  </p>
                ) : null}

                {taskCommentFormError ? (
                  <p className="rounded-xl border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
                    {taskCommentFormError}
                  </p>
                ) : null}
              </ModalBody>
              <ModalFooter>
                <Button
                  variant="flat"
                  startContent={<MaterialSymbol name="close" className="text-[18px]" />}
                  isDisabled={isSavingTaskComment}
                  onPress={() => {
                    closeModal();
                    closeTaskCommentsModal();
                  }}
                >
                  Fechar
                </Button>
                <Button
                  color="primary"
                  type="submit"
                  isLoading={isSavingTaskComment}
                  startContent={<MaterialSymbol name="save" className="text-[18px]" />}
                >
                  Salvar comentário
                </Button>
              </ModalFooter>
            </form>
          )}
        </ModalContent>
      </Modal>

      <Modal
        isOpen={isExportModalOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            handleCloseExportModal();
          }
        }}
        size="5xl"
        classNames={wideModalClassNames}
      >
        <ModalContent>
          {(closeModal) => (
            <>
              <ModalHeader className="flex items-center gap-2">
                <MaterialSymbol name="picture_as_pdf" className="text-[20px] text-danger" />
                Exportar projeto em PDF
              </ModalHeader>
              <ModalBody className="space-y-3">
                <p className="text-sm text-foreground/80">A exportação será gerada pelo backend.</p>

                {roadmapProject ? (
                  <div className="rounded-xl border border-default-200 bg-content1/70 p-3 text-sm">
                    <p className="font-semibold text-foreground">{roadmapProject.name}</p>
                    <p className="text-foreground/70">
                      Período: {formatDate(roadmapProject.startDate)} até{" "}
                      {formatDate(roadmapProject.endDate)}
                    </p>
                    <p className="text-foreground/70">
                      Fases: {roadmapProject.phases.length} | Tarefas: {roadmapProject.tasks.length}
                    </p>
                    <p className="text-foreground/70">
                      Concluído do projeto: {formatPercent(planningProgress.projectPercent)}
                    </p>
                  </div>
                ) : null}

                {exportModalError ? (
                  <p className="rounded-xl border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
                    {exportModalError}
                  </p>
                ) : null}

                {isExportingRoadmapPdf ? (
                  <p className="rounded-xl border border-default-200 bg-default-100 px-3 py-2 text-sm text-foreground/80">
                    Gerando PDF no backend...
                  </p>
                ) : null}

                {!isExportingRoadmapPdf && exportPdfURL ? (
                  <div className="overflow-hidden rounded-xl border border-default-200 bg-content1">
                    <iframe
                      title="Pré-visualização do PDF do projeto"
                      src={exportPdfURL}
                      className="h-[65vh] w-full"
                    />
                  </div>
                ) : null}
              </ModalBody>
              <ModalFooter>
                <Button
                  variant="flat"
                  startContent={<MaterialSymbol name="close" className="text-[18px]" />}
                  onPress={() => {
                    closeModal();
                    handleCloseExportModal();
                  }}
                >
                  Fechar
                </Button>
                <Button
                  variant="flat"
                  color="primary"
                  startContent={<MaterialSymbol name="download" className="text-[18px]" />}
                  onPress={handleDownloadExportPdf}
                  isDisabled={!exportPdfURL || isExportingRoadmapPdf}
                >
                  Baixar PDF
                </Button>
                <Button
                  color="danger"
                  isLoading={isExportingRoadmapPdf}
                  startContent={
                    !isExportingRoadmapPdf ? (
                      <MaterialSymbol name="picture_as_pdf" className="text-[18px]" />
                    ) : undefined
                  }
                  onPress={() => {
                    void handleExportRoadmapPdf();
                  }}
                >
                  Gerar novamente
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      <Modal
        isOpen={isPhaseModalOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setIsPhaseModalOpen(false);
            setEditingPhase(null);
          }
        }}
        size="2xl"
        classNames={phaseModalClassNames}
      >
        <ModalContent>
          {(closeModal) => (
            <form onSubmit={handleSubmitPhase}>
              <ModalHeader>{editingPhase ? "Editar fase" : "Adicionar fase"}</ModalHeader>
              <ModalBody className="space-y-4">
                <Input
                  value={phaseForm.name}
                  onValueChange={(value) =>
                    setPhaseForm((currentForm) => ({ ...currentForm, name: value }))
                  }
                  label="Nome da fase"
                  isRequired
                />

                <label className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/60">
                  Descrição da fase
                </label>
                <textarea
                  value={phaseForm.description}
                  onChange={(event) =>
                    setPhaseForm((currentForm) => ({
                      ...currentForm,
                      description: event.target.value,
                    }))
                  }
                  rows={4}
                  className="w-full rounded-xl border border-default-200 bg-transparent px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
                  placeholder="Descreva o escopo desta fase"
                />

                <div className="grid gap-3 md:grid-cols-2">
                  <Input
                    type="date"
                    value={phaseForm.startsOn}
                    onValueChange={(value) =>
                      setPhaseForm((currentForm) => ({
                        ...currentForm,
                        startsOn: value,
                      }))
                    }
                    label="Data inicial"
                  />
                  <Input
                    type="date"
                    value={phaseForm.endsOn}
                    onValueChange={(value) =>
                      setPhaseForm((currentForm) => ({
                        ...currentForm,
                        endsOn: value,
                      }))
                    }
                    label="Data final"
                  />
                </div>

                {phaseFormError ? (
                  <p className="rounded-xl border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
                    {phaseFormError}
                  </p>
                ) : null}
              </ModalBody>
              <ModalFooter>
                <Button
                  variant="flat"
                  startContent={<MaterialSymbol name="close" className="text-[18px]" />}
                  onPress={() => {
                    closeModal();
                    setIsPhaseModalOpen(false);
                    setEditingPhase(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  color="primary"
                  type="submit"
                  isLoading={isSavingPhase}
                  startContent={<MaterialSymbol name="save" className="text-[18px]" />}
                >
                  {editingPhase ? "Salvar alterações" : "Salvar fase"}
                </Button>
              </ModalFooter>
            </form>
          )}
        </ModalContent>
      </Modal>

      <Modal
        isOpen={isSubPhaseModalOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setIsSubPhaseModalOpen(false);
            setEditingSubPhase(null);
          }
        }}
        size="2xl"
        classNames={phaseModalClassNames}
      >
        <ModalContent>
          {(closeModal) => (
            <form onSubmit={handleSubmitSubPhase}>
              <ModalHeader className="flex items-center gap-2">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-success-100 text-xs font-bold text-success-700">
                  S
                </span>
                {selectedPhaseForSubPhase
                  ? editingSubPhase
                    ? `Editar sub-fase na fase ${selectedPhaseForSubPhase.name}`
                    : `Adicionar sub-fase na fase ${selectedPhaseForSubPhase.name}`
                  : editingSubPhase
                    ? "Editar sub-fase"
                    : "Adicionar sub-fase"}
              </ModalHeader>
              <ModalBody className="space-y-4">
                <Input
                  value={subPhaseForm.name}
                  onValueChange={(value) =>
                    setSubPhaseForm((currentForm) => ({ ...currentForm, name: value }))
                  }
                  label="Título da sub-fase"
                  isRequired
                />

                <label className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/60">
                  Descrição
                </label>
                <textarea
                  value={subPhaseForm.description}
                  onChange={(event) =>
                    setSubPhaseForm((currentForm) => ({
                      ...currentForm,
                      description: event.target.value,
                    }))
                  }
                  rows={4}
                  className="w-full rounded-xl border border-default-200 bg-transparent px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
                  placeholder="Descreva o escopo da sub-fase"
                />

                <div className="grid gap-3 md:grid-cols-2">
                  <Input
                    type="date"
                    value={subPhaseForm.startsOn}
                    onValueChange={(value) =>
                      setSubPhaseForm((currentForm) => ({
                        ...currentForm,
                        startsOn: value,
                      }))
                    }
                    label="Data inicial"
                  />
                  <Input
                    type="date"
                    value={subPhaseForm.endsOn}
                    onValueChange={(value) =>
                      setSubPhaseForm((currentForm) => ({
                        ...currentForm,
                        endsOn: value,
                      }))
                    }
                    label="Data final"
                  />
                </div>

                {subPhaseFormError ? (
                  <p className="rounded-xl border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
                    {subPhaseFormError}
                  </p>
                ) : null}
              </ModalBody>
              <ModalFooter>
                <Button
                  variant="flat"
                  startContent={<MaterialSymbol name="close" className="text-[18px]" />}
                  onPress={() => {
                    closeModal();
                    setIsSubPhaseModalOpen(false);
                    setEditingSubPhase(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  color="primary"
                  type="submit"
                  isLoading={isSavingSubPhase}
                  startContent={<MaterialSymbol name="save" className="text-[18px]" />}
                >
                  {editingSubPhase ? "Salvar alterações" : "Salvar sub-fase"}
                </Button>
              </ModalFooter>
            </form>
          )}
        </ModalContent>
      </Modal>

      <Modal
        isOpen={isTaskModalOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setIsTaskModalOpen(false);
            setEditingTask(null);
          }
        }}
        size={editingTask ? "5xl" : "2xl"}
        classNames={editingTask ? veryWideTaskModalClassNames : taskCreateModalClassNames}
      >
        <ModalContent>
          {(closeModal) => (
            <form onSubmit={handleSubmitTask}>
              <ModalHeader className="flex items-center gap-2">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-warning-100 text-xs font-bold text-warning-700">
                  T
                </span>
                {editingTask
                  ? taskModalContext?.subPhase
                    ? `Editar tarefa na sub-fase ${taskModalContext.subPhase.name}`
                    : taskModalContext?.phase
                      ? `Editar tarefa na fase ${taskModalContext.phase.name}`
                      : "Editar tarefa"
                  : taskModalContext?.subPhase
                    ? `Adicionar tarefa na sub-fase ${taskModalContext.subPhase.name}`
                    : taskModalContext?.phase
                      ? `Adicionar tarefa na fase ${taskModalContext.phase.name}`
                      : "Adicionar tarefa"}
              </ModalHeader>
              <ModalBody className="space-y-4">
                <p className="rounded-lg bg-default-100/70 px-3 py-2 text-xs text-foreground/70">
                  {taskModalContext
                    ? buildTaskBreadcrumb(taskModalContext.phase, taskModalContext.subPhase)
                    : "-"}
                </p>

                <Input
                  value={taskForm.name}
                  onValueChange={(value) =>
                    setTaskForm((currentForm) => ({ ...currentForm, name: value }))
                  }
                  label="Título"
                  isRequired
                />

                <label className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/60">
                  Descrição
                </label>
                <textarea
                  value={taskForm.description}
                  onChange={(event) =>
                    setTaskForm((currentForm) => ({
                      ...currentForm,
                      description: event.target.value,
                    }))
                  }
                  rows={4}
                  className="w-full rounded-xl border border-default-200 bg-transparent px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
                  placeholder="Descreva o escopo da tarefa"
                />

                <div>
                  <div className="flex flex-col gap-2 md:flex-row md:items-center">
                    <div className="md:basis-2/3">
                      <label className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/60">
                        Periodo
                      </label>
                    </div>
                    <div className="md:basis-1/3 text-left">
                      <label className="text-left text-xs font-semibold uppercase tracking-[0.16em] text-foreground/60">
                        Status
                      </label>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-end">
                    <div className="md:flex-1">
                      <Input
                        type="date"
                        value={taskForm.startsOn}
                        onValueChange={(value) =>
                          setTaskForm((currentForm) => ({
                            ...currentForm,
                            startsOn: value,
                          }))
                        }
                        label="Data inicial"
                      />
                    </div>
                    <div className="md:flex-1">
                      <Input
                        type="date"
                        value={taskForm.endsOn}
                        onValueChange={(value) =>
                          setTaskForm((currentForm) => ({
                            ...currentForm,
                            endsOn: value,
                          }))
                        }
                        label="Data final"
                      />
                    </div>
                    <div className="md:flex-1 text-left">
                      <select
                        value={taskForm.status}
                        onChange={(event) =>
                          setTaskForm((currentForm) => ({
                            ...currentForm,
                            status: normalizeTaskStatusValue(event.target.value),
                          }))
                        }
                        className="h-14 w-full rounded-xl border border-default-200 bg-transparent px-3 text-left text-sm text-foreground outline-none transition-colors focus:border-primary"
                      >
                        {taskStatusOptions.map((statusOption) => (
                          <option key={statusOption.value} value={statusOption.value}>
                            {statusOption.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/60">
                    Responsável pela tarefa
                  </label>
                  <select
                    value={taskForm.responsibleUserId}
                    onChange={(event) =>
                      setTaskForm((currentForm) => ({
                        ...currentForm,
                        responsibleUserId: event.target.value,
                      }))
                    }
                    className="mt-2 h-10 w-full rounded-xl border border-default-200 bg-transparent px-3 text-sm text-foreground outline-none transition-colors focus:border-primary"
                  >
                    <option value="">Sem responsável definido</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.login})
                      </option>
                    ))}
                  </select>
                </div>

                {taskFormError ? (
                  <p className="rounded-xl border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
                    {taskFormError}
                  </p>
                ) : null}
              </ModalBody>
              <ModalFooter>
                <Button
                  variant="flat"
                  startContent={<MaterialSymbol name="close" className="text-[18px]" />}
                  onPress={() => {
                    closeModal();
                    setIsTaskModalOpen(false);
                    setEditingTask(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  color="primary"
                  type="submit"
                  isLoading={isSavingTask}
                  startContent={<MaterialSymbol name="save" className="text-[18px]" />}
                >
                  {editingTask ? "Salvar alterações" : "Salvar tarefa"}
                </Button>
              </ModalFooter>
            </form>
          )}
        </ModalContent>
      </Modal>
    </section>
  );
}

const plannerTaskMetaPrefix = "__planner_meta__:";

function encodePlannerTaskMeta(meta: PlannerTaskMeta): string {
  return `${plannerTaskMetaPrefix}${JSON.stringify(meta)}`;
}

function decodePlannerTaskMeta(objective: string): PlannerTaskMeta | null {
  const rawObjective = (objective || "").trim();
  if (!rawObjective.startsWith(plannerTaskMetaPrefix)) {
    return null;
  }

  const encodedMeta = rawObjective.slice(plannerTaskMetaPrefix.length);
  try {
    const parsed = JSON.parse(encodedMeta) as PlannerTaskMeta;
    if (!parsed || (parsed.kind !== "subphase" && parsed.kind !== "task")) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function buildTaskBreadcrumb(phase: ProjectPhase, subPhase: ProjectTask | null): string {
  if (subPhase) {
    return `Fase ${phase.name} / Sub-fase ${subPhase.name} / Tarefa`;
  }

  return `Fase ${phase.name} / Tarefa`;
}

function calculatePlanningProgress(project: ProjectDetail | null): PlanningProgressSummary {
  if (!project) {
    return {
      projectPercent: 0,
      phasePercentByID: {},
      taskPercentByID: {},
    };
  }

  type progressCount = {
    totalTasks: number;
    completedTasks: number;
  };

  const mergeProgressCounts = (
    currentCount: progressCount,
    incomingCount: progressCount,
  ): progressCount => ({
    totalTasks: currentCount.totalTasks + incomingCount.totalTasks,
    completedTasks: currentCount.completedTasks + incomingCount.completedTasks,
  });

  const taskByID = new Map(project.tasks.map((task) => [task.id, task]));
  const knownPhaseIDs = new Set(project.phases.map((phase) => phase.id));
  const childrenByTaskID = new Map<string, string[]>();
  const topLevelTaskIDsByPhaseID: Record<string, string[]> = {};
  const unlinkedTopLevelTaskIDs: string[] = [];

  for (const phase of project.phases) {
    topLevelTaskIDsByPhaseID[phase.id] = [];
  }

  for (const task of project.tasks) {
    const meta = decodePlannerTaskMeta(task.objective);
    const hasParentTask =
      meta?.kind === "task" &&
      meta.parentType !== "phase" &&
      !!meta.parentId &&
      taskByID.has(meta.parentId);

    if (hasParentTask && meta?.parentId) {
      const parentTaskID = meta.parentId;
      const childIDs = childrenByTaskID.get(parentTaskID) || [];
      childIDs.push(task.id);
      childrenByTaskID.set(parentTaskID, childIDs);
      continue;
    }

    if (task.projectPhaseId && knownPhaseIDs.has(task.projectPhaseId)) {
      topLevelTaskIDsByPhaseID[task.projectPhaseId].push(task.id);
      continue;
    }

    unlinkedTopLevelTaskIDs.push(task.id);
  }

  const taskPercentByID: Record<string, number> = {};
  const taskCountByID: Record<string, progressCount> = {};
  const visitedTaskIDs = new Set<string>();

  const computeTaskCount = (taskID: string): progressCount => {
    if (Object.prototype.hasOwnProperty.call(taskCountByID, taskID)) {
      return taskCountByID[taskID];
    }

    if (visitedTaskIDs.has(taskID)) {
      return { totalTasks: 0, completedTasks: 0 };
    }
    visitedTaskIDs.add(taskID);

    const childIDs = childrenByTaskID.get(taskID) || [];
    let count: progressCount = { totalTasks: 0, completedTasks: 0 };
    if (childIDs.length > 0) {
      for (const childID of childIDs) {
        count = mergeProgressCounts(count, computeTaskCount(childID));
      }
    }

    if (childIDs.length === 0 && count.totalTasks === 0) {
      const task = taskByID.get(taskID);
      const isCompleted = task ? isTaskCompleted(task.status) : false;
      const isCanceled = task ? isTaskCancelled(task.status) : false;
      count = {
        totalTasks: isCanceled ? 0 : 1,
        completedTasks: isCompleted ? 1 : 0,
      };
    }

    visitedTaskIDs.delete(taskID);
    taskCountByID[taskID] = count;
    taskPercentByID[taskID] = percentFromCounts(count.completedTasks, count.totalTasks);
    return count;
  };

  for (const task of project.tasks) {
    computeTaskCount(task.id);
  }

  const phasePercentByID: Record<string, number> = {};
  let projectCount: progressCount = { totalTasks: 0, completedTasks: 0 };

  for (const phase of project.phases) {
    const phaseTopLevelTaskIDs = topLevelTaskIDsByPhaseID[phase.id] || [];
    let phaseCount: progressCount = { totalTasks: 0, completedTasks: 0 };
    for (const taskID of phaseTopLevelTaskIDs) {
      phaseCount = mergeProgressCounts(
        phaseCount,
        taskCountByID[taskID] || { totalTasks: 0, completedTasks: 0 },
      );
    }

    phasePercentByID[phase.id] = percentFromCounts(
      phaseCount.completedTasks,
      phaseCount.totalTasks,
    );
    projectCount = mergeProgressCounts(projectCount, phaseCount);
  }

  for (const taskID of unlinkedTopLevelTaskIDs) {
    projectCount = mergeProgressCounts(
      projectCount,
      taskCountByID[taskID] || { totalTasks: 0, completedTasks: 0 },
    );
  }

  return {
    projectPercent: percentFromCounts(projectCount.completedTasks, projectCount.totalTasks),
    phasePercentByID,
    taskPercentByID,
  };
}

function buildPlanningRows(
  project: ProjectDetail | null,
  planningProgress: PlanningProgressSummary,
): PlanningRow[] {
  if (!project) {
    return [];
  }

  const rows: PlanningRow[] = [];
  const orderedPhases = [...project.phases].sort(comparePhaseByStartDate);
  const orderedTasks = [...project.tasks].sort(compareTaskByStartDate);
  const knownPhaseIDs = new Set(orderedPhases.map((phase) => phase.id));

  for (const phase of orderedPhases) {
    const phaseTasks = orderedTasks.filter((task) => task.projectPhaseId === phase.id);
    const phaseTaskIDSet = new Set(phaseTasks.map((task) => task.id));
    const subPhases = phaseTasks
      .filter((task) => {
        const meta = decodePlannerTaskMeta(task.objective);
        return meta?.kind === "subphase";
      })
      .sort(compareTaskByStartDate);

    const subPhaseMap = new Map(subPhases.map((subPhase) => [subPhase.id, subPhase]));

    const phaseTasksDirect = phaseTasks
      .filter((task) => {
        const meta = decodePlannerTaskMeta(task.objective);
        if (!meta) {
          return true;
        }
        if (meta.kind === "subphase") {
          return false;
        }
        if (meta.parentType === "phase") {
          return true;
        }
        if (meta.parentId && phaseTaskIDSet.has(meta.parentId)) {
          return false;
        }
        return true;
      })
      .sort(compareTaskByStartDate);

    rows.push({
      key: `phase-${phase.id}`,
      level: 0,
      kind: "phase",
      iconLabel: "F",
      iconClassName: "bg-primary-100 text-primary-700",
      title: phase.name,
      description: phase.description || "",
      breadcrumb: "Fase",
      startsOn: phase.startsOn,
      endsOn: phase.endsOn,
      progressPercent: planningProgress.phasePercentByID[phase.id] ?? 0,
      phaseRef: phase,
      subPhaseRef: null,
      taskRef: null,
    });

    for (const subPhase of subPhases) {
      rows.push({
        key: `subphase-${subPhase.id}`,
        level: 1,
        kind: "subphase",
        iconLabel: "S",
        iconClassName: "bg-success-100 text-success-700",
        title: subPhase.name,
        description: subPhase.description || "",
        breadcrumb: `Fase ${phase.name} / Sub-fase`,
        startsOn: subPhase.startsOn,
        endsOn: subPhase.endsOn,
        progressPercent: planningProgress.taskPercentByID[subPhase.id] ?? 0,
        phaseRef: phase,
        subPhaseRef: subPhase,
        taskRef: subPhase,
      });

      const subPhaseTasks = phaseTasks
        .filter((task) => {
          const meta = decodePlannerTaskMeta(task.objective);
          return (
            meta?.kind === "task" &&
            meta.parentType === "subphase" &&
            meta.parentId === subPhase.id
          );
        })
        .sort(compareTaskByStartDate);

      for (const task of subPhaseTasks) {
        rows.push({
          key: `task-subphase-${task.id}`,
          level: 2,
          kind: "task",
          iconLabel: "T",
          iconClassName: "bg-warning-100 text-warning-700",
          title: task.name,
          description: task.description || "",
          breadcrumb: buildTaskBreadcrumb(phase, subPhase),
          startsOn: task.startsOn,
          endsOn: task.endsOn,
          progressPercent: planningProgress.taskPercentByID[task.id] ?? 0,
          phaseRef: phase,
          subPhaseRef: subPhase,
          taskRef: task,
        });
      }
    }

    for (const task of phaseTasksDirect) {
      rows.push({
        key: `task-phase-${task.id}`,
        level: 1,
        kind: "task",
        iconLabel: "T",
        iconClassName: "bg-warning-100 text-warning-700",
        title: task.name,
        description: task.description || "",
        breadcrumb: buildTaskBreadcrumb(phase, null),
        startsOn: task.startsOn,
        endsOn: task.endsOn,
        progressPercent: planningProgress.taskPercentByID[task.id] ?? 0,
        phaseRef: phase,
        subPhaseRef: null,
        taskRef: task,
      });
    }
  }

  const tasksWithoutKnownPhase = orderedTasks
    .filter(
      (task) => !task.projectPhaseId || !knownPhaseIDs.has(task.projectPhaseId),
    )
    .sort(compareTaskByStartDate);
  for (const task of tasksWithoutKnownPhase) {
    const fakePhase: ProjectPhase = {
      id: "",
      projectId: project.id,
      name: "Sem fase",
      description: "",
      objective: "",
      startsOn: undefined,
      endsOn: undefined,
      position: 0,
      active: true,
      files: [],
    };

    rows.push({
      key: `task-unlinked-${task.id}`,
      level: 1,
      kind: "task",
      iconLabel: "T",
      iconClassName: "bg-warning-100 text-warning-700",
      title: task.name,
      description: task.description || "",
      breadcrumb: "Sem fase / Tarefa",
      startsOn: task.startsOn,
      endsOn: task.endsOn,
      progressPercent: planningProgress.taskPercentByID[task.id] ?? 0,
      phaseRef: fakePhase,
      subPhaseRef: null,
      taskRef: task,
    });
  }

  return rows;
}

function flattenTaskComments(comments: ProjectTaskComment[]): FlattenedTaskComment[] {
  if (comments.length === 0) {
    return [];
  }

  const childrenByParentID = new Map<string, ProjectTaskComment[]>();
  for (const comment of comments) {
    const parentKey = (comment.parentCommentId || "").trim();
    const currentChildren = childrenByParentID.get(parentKey) || [];
    currentChildren.push(comment);
    childrenByParentID.set(parentKey, currentChildren);
  }

  childrenByParentID.forEach((childComments: ProjectTaskComment[]) => {
    childComments.sort((a: ProjectTaskComment, b: ProjectTaskComment) => {
      const createdAtA = new Date(a.created || "").getTime();
      const createdAtB = new Date(b.created || "").getTime();
      const byCreatedAt =
        (Number.isNaN(createdAtA) ? 0 : createdAtA) -
        (Number.isNaN(createdAtB) ? 0 : createdAtB);
      if (byCreatedAt !== 0) {
        return byCreatedAt;
      }
      return (a.id || "").localeCompare(b.id || "");
    });
  });

  const flattened: FlattenedTaskComment[] = [];
  const visited = new Set<string>();

  const walk = (parentCommentID: string, depth: number) => {
    const children = childrenByParentID.get(parentCommentID) || [];
    for (const child of children) {
      if (visited.has(child.id)) {
        continue;
      }
      visited.add(child.id);
      flattened.push({
        comment: child,
        depth,
      });
      walk(child.id, depth + 1);
    }
  };

  walk("", 0);

  for (const comment of comments) {
    if (visited.has(comment.id)) {
      continue;
    }
    flattened.push({ comment, depth: 0 });
  }

  return flattened;
}

function filterProjectsBySearch(
  projects: ProjectListItem[],
  rawSearch: string,
): ProjectListItem[] {
  const normalizedSearch = rawSearch.trim().toLowerCase();
  if (!normalizedSearch) {
    return projects;
  }

  return projects.filter((project) =>
    [project.name, project.objective, project.projectTypeName, project.projectCategoryName]
      .map((value) => (value || "").toLowerCase())
      .some((value) => value.includes(normalizedSearch)),
  );
}

function filterUsersBySearch(users: UserSummary[], rawSearch: string): UserSummary[] {
  const normalizedSearch = rawSearch.trim().toLowerCase();
  if (!normalizedSearch) {
    return users;
  }

  return users.filter((user) =>
    [user.name, user.login, user.email]
      .map((value) => (value || "").toLowerCase())
      .some((value) => value.includes(normalizedSearch)),
  );
}

function parseSortableDate(value?: string): number {
  if (!value) {
    return Number.POSITIVE_INFINITY;
  }
  const parsed = new Date(value);
  const timestamp = parsed.getTime();
  if (Number.isNaN(timestamp)) {
    return Number.POSITIVE_INFINITY;
  }
  return timestamp;
}

function comparePhaseByStartDate(a: ProjectPhase, b: ProjectPhase): number {
  const byStartDate = parseSortableDate(a.startsOn) - parseSortableDate(b.startsOn);
  if (byStartDate !== 0) {
    return byStartDate;
  }

  const byPosition = a.position - b.position;
  if (byPosition !== 0) {
    return byPosition;
  }

  return a.name.localeCompare(b.name, "pt-BR");
}

function compareTaskByStartDate(a: ProjectTask, b: ProjectTask): number {
  const byStartDate = parseSortableDate(a.startsOn) - parseSortableDate(b.startsOn);
  if (byStartDate !== 0) {
    return byStartDate;
  }

  const byPosition = a.position - b.position;
  if (byPosition !== 0) {
    return byPosition;
  }

  return a.name.localeCompare(b.name, "pt-BR");
}

function normalizeTaskStatusValue(value: string): string {
  const normalizedValue = (value || "").trim().toLowerCase();
  switch (normalizedValue) {
    case "":
    case "pendente":
      return "planejada";
    case "em_andamento":
      return "iniciada";
    case "planejada":
    case "iniciada":
    case "concluida":
    case "cancelada":
      return normalizedValue;
    default:
      return "planejada";
  }
}

function isTaskCompleted(status: string): boolean {
  return normalizeTaskStatusValue(status) === "concluida";
}

function isTaskCancelled(status: string): boolean {
  return normalizeTaskStatusValue(status) === "cancelada";
}

function percentFromCounts(completedTasks: number, totalTasks: number): number {
  if (totalTasks <= 0) {
    return 0;
  }

  return roundPercent((completedTasks / totalTasks) * 100);
}

function roundPercent(value: number): number {
  if (Number.isNaN(value)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(value)));
}

function toDateInputValue(value?: string): string {
  if (!value) {
    return "";
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  return parsedDate.toISOString().slice(0, 10);
}

function readTokenFromCookie(): string {
  if (typeof document === "undefined") {
    return "";
  }

  const match = document.cookie.match(/(?:^|;\s*)admin_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

function getApiErrorMessage(payload: unknown, fallback: string): string {
  if (payload && typeof payload === "object" && "error" in payload) {
    const errorValue = (payload as ApiError).error;
    if (typeof errorValue === "string" && errorValue.trim()) {
      return errorValue;
    }
  }

  return fallback;
}

function formatDate(value?: string): string {
  if (!value) {
    return "-";
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return "-";
  }

  return parsedDate.toLocaleDateString("pt-BR");
}

function formatPercent(value: number): string {
  return `${roundPercent(value)}%`;
}

function getProgressBadgeClassName(value: number): string {
  const roundedValue = roundPercent(value);
  if (roundedValue >= 100) {
    return "border-success/40 bg-success/10 text-success";
  }

  if (roundedValue <= 0) {
    return "border-default-300 bg-default-100 text-foreground/70";
  }

  return "border-warning/40 bg-warning/10 text-warning";
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(value || 0);
}

function formatTaskStatusLabel(value: string): string {
  switch (normalizeTaskStatusValue(value)) {
    case "iniciada":
      return "Iniciada";
    case "concluida":
      return "Concluída";
    case "cancelada":
      return "Cancelada";
    case "planejada":
    default:
      return "Planejada";
  }
}

function normalizeProjectStatusValue(
  value: string,
  active = true,
): "planejamento" | "andamento" | "concluido" | "cancelado" {
  const normalizedValue = (value || "").trim().toLowerCase();
  switch (normalizedValue) {
    case "cancelado":
    case "cancelada":
      return "cancelado";
    case "concluido":
    case "concluida":
      return "concluido";
    case "andamento":
    case "em_andamento":
    case "em andamento":
      return "andamento";
    case "planejamento":
      return "planejamento";
    default:
      return active ? "planejamento" : "cancelado";
  }
}

function formatProjectStatusLabel(
  value: "planejamento" | "andamento" | "concluido" | "cancelado",
): string {
  switch (value) {
    case "andamento":
      return "Em andamento";
    case "concluido":
      return "Concluído";
    case "cancelado":
      return "Cancelado";
    case "planejamento":
    default:
      return "Planejamento";
  }
}

function getProjectStatusBadgeClassName(
  value: "planejamento" | "andamento" | "concluido" | "cancelado",
): string {
  switch (value) {
    case "andamento":
      return "border-warning/40 bg-warning/10 text-warning";
    case "concluido":
      return "border-success/40 bg-success/10 text-success";
    case "cancelado":
      return "border-danger/40 bg-danger/10 text-danger";
    case "planejamento":
    default:
      return "border-primary/40 bg-primary/10 text-primary";
  }
}

function formatRevenueStatusLabel(value: string): string {
  switch (normalizeRevenueStatusValue(value)) {
    case "recebido":
      return "Recebido";
    case "cancelado":
      return "Cancelado";
    case "pendente":
    default:
      return "Pendente";
  }
}

function normalizeRevenueStatusValue(value: string): "pendente" | "recebido" | "cancelado" {
  const normalizedValue = (value || "").trim().toLowerCase();
  switch (normalizedValue) {
    case "recebido":
      return "recebido";
    case "cancelado":
      return "cancelado";
    case "pendente":
    default:
      return "pendente";
  }
}

function normalizeMonthlyChargeStatusValue(value: string): "pendente" | "pago" | "cancelada" {
  const normalizedValue = (value || "").trim().toLowerCase();
  switch (normalizedValue) {
    case "pago":
    case "recebido":
      return "pago";
    case "cancelada":
    case "cancelado":
      return "cancelada";
    case "pendente":
    default:
      return "pendente";
  }
}

function formatMonthlyChargeStatusLabel(value: string): string {
  switch (normalizeMonthlyChargeStatusValue(value)) {
    case "pago":
      return "Pago";
    case "cancelada":
      return "Cancelada";
    case "pendente":
    default:
      return "Pendente";
  }
}

function getMonthlyChargeStatusBadgeClassName(value: string): string {
  switch (normalizeMonthlyChargeStatusValue(value)) {
    case "pago":
      return "border-success/40 bg-success/10 text-success";
    case "cancelada":
      return "border-danger/40 bg-danger/10 text-danger";
    case "pendente":
    default:
      return "border-warning/40 bg-warning/10 text-warning";
  }
}

function formatLifecycleTypeLabel(value: string): string {
  return value === "recorrente" ? "Recorrente" : "Temporário";
}

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatTextAsHtml(value: string): string {
  const normalized = (value || "").trim();
  if (!normalized) {
    return "-";
  }

  return escapeHtml(normalized).replace(/\n/g, "<br />");
}

function isProjectExportPayload(payload: unknown): payload is ProjectExportPayload {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return false;
  }

  const candidate = payload as Partial<ProjectExportPayload>;
  return Boolean(candidate.project && candidate.summary && Array.isArray(candidate.planning));
}

function formatDateTime(value?: string): string {
  if (!value) {
    return "-";
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return "-";
  }

  return parsedDate.toLocaleString("pt-BR");
}

function getTaskCommentAuthorName(comment: ProjectTaskComment): string {
  const authorName = (comment.authorName || comment.userName || "").trim();
  if (authorName) {
    return authorName;
  }
  if ((comment.authorType || "").toLowerCase() === "client") {
    return "Cliente";
  }
  return "Usuário";
}

function getTaskCommentAuthorRoleLabel(comment: ProjectTaskComment): string {
  if (comment.isTaskResponsible) {
    return "Responsável";
  }
  if (comment.isProjectManager) {
    return "Gestor";
  }
  if ((comment.authorType || "").toLowerCase() === "client") {
    return "Cliente";
  }
  return "Usuário";
}

function getTaskCommentAuthorIconName(comment: ProjectTaskComment): string {
  if (comment.isTaskResponsible) {
    return "assignment_ind";
  }
  if (comment.isProjectManager) {
    return "manage_accounts";
  }
  if ((comment.authorType || "").toLowerCase() === "client") {
    return "badge";
  }
  return "person";
}

function formatPlanningKindLabel(kind: string): string {
  switch ((kind || "").toLowerCase()) {
    case "phase":
      return "Fase";
    case "subphase":
      return "Sub-fase";
    default:
      return "Tarefa";
  }
}

function planningIconLabel(kind: string): "F" | "S" | "T" {
  switch ((kind || "").toLowerCase()) {
    case "phase":
      return "F";
    case "subphase":
      return "S";
    default:
      return "T";
  }
}

function planningIconClassName(kind: string): string {
  switch ((kind || "").toLowerCase()) {
    case "phase":
      return "node-phase";
    case "subphase":
      return "node-subphase";
    default:
      return "node-task";
  }
}

function buildProjectPdfDocumentFromExport(exportPayload: ProjectExportPayload): string {
  const project = exportPayload.project;
  const summary = exportPayload.summary;
  const planning = exportPayload.planning;
  const exportedAtRaw = exportPayload.generatedAt
    ? formatDateTime(exportPayload.generatedAt)
    : "";
  const exportedAt = exportedAtRaw && exportedAtRaw !== "-"
    ? exportedAtRaw
    : new Date().toLocaleString("pt-BR");
  const projectPeriod = `${formatDate(project.startDate)} até ${formatDate(project.endDate)}`;

  const clientsRowsHtml =
    project.clients.length > 0
      ? project.clients
          .map(
            (client) => `
              <tr>
                <td>${escapeHtml(client.name || "-")}</td>
                <td>${escapeHtml(client.email || "-")}</td>
                <td>${escapeHtml(client.login || "-")}</td>
                <td>${escapeHtml(client.role || "-")}</td>
              </tr>
            `,
          )
          .join("")
      : `<tr><td colspan="4" class="empty">Nenhum cliente vinculado.</td></tr>`;

  const revenuesRowsHtml =
    project.revenues.length > 0
      ? project.revenues
          .map((revenue) => {
            const receiptsHtml =
              revenue.receipts.length > 0
                ? `<ul class="compact-list">${revenue.receipts
                    .map(
                      (receipt) => `
                        <li>
                          <strong>${escapeHtml(receipt.fileName || "-")}</strong>
                          <span> | ${escapeHtml(receipt.contentType || "-")} | ${escapeHtml(
                            formatDate(receipt.issuedOn),
                          )}</span>
                        </li>
                      `,
                    )
                    .join("")}</ul>`
                : "-";

            return `
              <tr>
                <td>${escapeHtml(revenue.title || "-")}</td>
                <td>${formatCurrency(revenue.amount)}</td>
                <td>${escapeHtml(formatDate(revenue.expectedOn))}</td>
                <td>${escapeHtml(formatDate(revenue.receivedOn))}</td>
                <td>${escapeHtml(formatRevenueStatusLabel(revenue.status))}</td>
                <td>${formatTextAsHtml(revenue.objective)}</td>
                <td>${receiptsHtml}</td>
              </tr>
            `;
          })
          .join("")
      : `<tr><td colspan="7" class="empty">Nenhuma receita cadastrada.</td></tr>`;

  const monthlyChargesRowsHtml =
    project.monthlyCharges.length > 0
      ? project.monthlyCharges
          .map(
            (charge) => `
              <tr>
                <td>${escapeHtml(charge.title || "-")}</td>
                <td>${escapeHtml(charge.installment || "-")}</td>
                <td>${formatCurrency(charge.amount)}</td>
                <td>${escapeHtml(charge.dueDay)}</td>
                <td>${escapeHtml(formatDate(charge.startsOn))}</td>
                <td>${escapeHtml(formatDate(charge.endsOn))}</td>
                <td>${escapeHtml(formatMonthlyChargeStatusLabel(charge.status))}</td>
              </tr>
            `,
          )
          .join("")
      : `<tr><td colspan="7" class="empty">Nenhuma cobrança mensal cadastrada.</td></tr>`;

  const planningRowsHtml =
    planning.length > 0
      ? planning
          .map((row) => {
            const levelOffset = Math.max(row.level || 0, 0) * 16;
            const statusLabel = formatTaskStatusLabel(row.status);
            const filesLabel =
              row.files.length > 0
                ? row.files
                    .map((file) => escapeHtml(file.fileName || file.fileKey || "-"))
                    .join(", ")
                : "-";

            return `
              <tr>
                <td>
                  <div class="tree-label" style="margin-left: ${levelOffset}px;">
                    <span class="node-icon ${planningIconClassName(row.kind)}">${planningIconLabel(
                      row.kind,
                    )}</span>
                    <span>${escapeHtml(row.title)}</span>
                  </div>
                  <div class="muted">${formatTextAsHtml(row.description)}</div>
                </td>
                <td>${escapeHtml(formatPlanningKindLabel(row.kind))}</td>
                <td>${escapeHtml(formatDate(row.startsOn))}</td>
                <td>${escapeHtml(formatDate(row.endsOn))}</td>
                <td>${escapeHtml(statusLabel)}</td>
                <td>${escapeHtml(formatPercent(row.progressPercent))}</td>
                <td>${filesLabel}</td>
              </tr>
            `;
          })
          .join("")
      : `<tr><td colspan="7" class="empty">Nenhuma fase/tarefa cadastrada.</td></tr>`;

  return `
    <!doctype html>
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <title>Projeto - ${escapeHtml(project.name)}</title>
        <style>
          @page { size: A4 landscape; margin: 12mm; }
          * { box-sizing: border-box; }
          body { margin: 0; font-family: Arial, sans-serif; color: #111827; font-size: 12px; }
          main { padding: 8px; }
          h1 { margin: 0 0 4px; font-size: 22px; }
          h2 { margin: 0 0 8px; font-size: 15px; }
          .subtitle { margin: 0; color: #4b5563; font-size: 12px; }
          .section { margin-top: 14px; }
          .summary-grid {
            margin-top: 10px;
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 8px;
          }
          .summary-item {
            border: 1px solid #d1d5db;
            border-radius: 8px;
            padding: 8px;
            background: #f9fafb;
          }
          .summary-item strong { display: block; font-size: 11px; color: #374151; margin-bottom: 4px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #d1d5db; padding: 6px; vertical-align: top; text-align: left; }
          th { background: #f3f4f6; font-weight: 700; }
          .empty { text-align: center; color: #6b7280; }
          .compact-list { margin: 0; padding-left: 16px; }
          .compact-list li + li { margin-top: 2px; }
          .muted { margin-top: 2px; color: #6b7280; font-size: 11px; }
          .tree-label { display: inline-flex; align-items: center; gap: 6px; font-weight: 600; }
          .node-icon {
            width: 18px;
            height: 18px;
            border-radius: 999px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            font-weight: 700;
          }
          .node-phase { background: #dbeafe; color: #1d4ed8; }
          .node-subphase { background: #dcfce7; color: #166534; }
          .node-task { background: #ffedd5; color: #9a3412; }
          .objective-block {
            margin-top: 10px;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            padding: 8px;
            background: #f9fafb;
          }
        </style>
      </head>
      <body>
        <main>
          <h1>${escapeHtml(project.name)}</h1>
          <p class="subtitle">Relatório completo do projeto</p>
          <p class="subtitle">Exportado em: ${escapeHtml(exportedAt)}</p>

          <section class="summary-grid">
            <div class="summary-item">
              <strong>Tipo</strong>
              ${escapeHtml(project.projectTypeName || "-")} (${escapeHtml(
                project.projectCategoryName || "Sem categoria",
              )})
            </div>
            <div class="summary-item">
              <strong>Ciclo</strong>
              ${escapeHtml(formatLifecycleTypeLabel(project.lifecycleType))}
            </div>
            <div class="summary-item">
              <strong>Status</strong>
              ${project.active ? "Ativo" : "Inativo"}
            </div>
            <div class="summary-item">
              <strong>Período</strong>
              ${escapeHtml(projectPeriod)}
            </div>
            <div class="summary-item">
              <strong>Manutenção mensal</strong>
              ${project.hasMonthlyMaintenance ? "Sim" : "Não"}
            </div>
            <div class="summary-item">
              <strong>Concluído do projeto</strong>
              ${escapeHtml(formatPercent(summary.projectPercent))}
            </div>
            <div class="summary-item">
              <strong>Total de clientes</strong>
              ${escapeHtml(project.clients.length)}
            </div>
            <div class="summary-item">
              <strong>Total de fases</strong>
              ${escapeHtml(summary.totalPhases)}
            </div>
            <div class="summary-item">
              <strong>Tarefas concluídas</strong>
              ${escapeHtml(summary.totalCompletedTasks)} / ${escapeHtml(summary.totalTrackedTasks)}
            </div>
          </section>

          <section class="objective-block">
            <h2>Objetivo do projeto</h2>
            <div>${formatTextAsHtml(project.objective)}</div>
          </section>

          <section class="section">
            <h2>Clientes vinculados</h2>
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Email</th>
                  <th>Login</th>
                  <th>Papel</th>
                </tr>
              </thead>
              <tbody>
                ${clientsRowsHtml}
              </tbody>
            </table>
          </section>

          <section class="section">
            <h2>Receitas</h2>
            <table>
              <thead>
                <tr>
                  <th>Título</th>
                  <th>Valor</th>
                  <th>Prevista</th>
                  <th>Recebida</th>
                  <th>Status</th>
                  <th>Objetivo</th>
                  <th>Comprovantes</th>
                </tr>
              </thead>
              <tbody>
                ${revenuesRowsHtml}
              </tbody>
            </table>
          </section>

          <section class="section">
            <h2>Cobranças mensais</h2>
            <table>
              <thead>
                <tr>
                  <th>Título</th>
                  <th>Parcela</th>
                  <th>Valor</th>
                  <th>Dia vencimento</th>
                  <th>Início</th>
                  <th>Fim</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${monthlyChargesRowsHtml}
              </tbody>
            </table>
          </section>

          <section class="section">
            <h2>Fases e tarefas</h2>
            <table>
              <thead>
                <tr>
                  <th>Título</th>
                  <th>Tipo</th>
                  <th>Data inicial</th>
                  <th>Data final</th>
                  <th>Status</th>
                  <th>Concluído</th>
                  <th>Arquivos</th>
                </tr>
              </thead>
              <tbody>
                ${planningRowsHtml}
              </tbody>
            </table>
          </section>
        </main>
      </body>
    </html>
  `;
}

function buildProjectPdfDocument(
  project: ProjectDetail,
  planningRows: PlanningRow[],
  planningProgress: PlanningProgressSummary,
): string {
  const exportedAt = new Date().toLocaleString("pt-BR");
  const projectPeriod = `${formatDate(project.startDate)} até ${formatDate(project.endDate)}`;

  const clientsRowsHtml =
    project.clients.length > 0
      ? project.clients
          .map(
            (client) => `
              <tr>
                <td>${escapeHtml(client.name || "-")}</td>
                <td>${escapeHtml(client.email || "-")}</td>
                <td>${escapeHtml(client.login || "-")}</td>
                <td>${escapeHtml(client.role || "-")}</td>
              </tr>
            `,
          )
          .join("")
      : `<tr><td colspan="4" class="empty">Nenhum cliente vinculado.</td></tr>`;

  const revenuesRowsHtml =
    project.revenues.length > 0
      ? project.revenues
          .map((revenue) => {
            const receiptsHtml =
              revenue.receipts.length > 0
                ? `<ul class="compact-list">${revenue.receipts
                    .map(
                      (receipt) => `
                        <li>
                          <strong>${escapeHtml(receipt.fileName || "-")}</strong>
                          <span> | ${escapeHtml(receipt.contentType || "-")} | ${escapeHtml(
                            formatDate(receipt.issuedOn),
                          )}</span>
                        </li>
                      `,
                    )
                    .join("")}</ul>`
                : "-";

            return `
              <tr>
                <td>${escapeHtml(revenue.title || "-")}</td>
                <td>${formatCurrency(revenue.amount)}</td>
                <td>${escapeHtml(formatDate(revenue.expectedOn))}</td>
                <td>${escapeHtml(formatDate(revenue.receivedOn))}</td>
                <td>${escapeHtml(formatRevenueStatusLabel(revenue.status))}</td>
                <td>${formatTextAsHtml(revenue.objective)}</td>
                <td>${receiptsHtml}</td>
              </tr>
            `;
          })
          .join("")
      : `<tr><td colspan="7" class="empty">Nenhuma receita cadastrada.</td></tr>`;

  const monthlyChargesRowsHtml =
    project.monthlyCharges.length > 0
      ? project.monthlyCharges
          .map(
            (charge) => `
              <tr>
                <td>${escapeHtml(charge.title || "-")}</td>
                <td>${escapeHtml(charge.installment || "-")}</td>
                <td>${formatCurrency(charge.amount)}</td>
                <td>${escapeHtml(charge.dueDay)}</td>
                <td>${escapeHtml(formatDate(charge.startsOn))}</td>
                <td>${escapeHtml(formatDate(charge.endsOn))}</td>
                <td>${escapeHtml(formatMonthlyChargeStatusLabel(charge.status))}</td>
              </tr>
            `,
          )
          .join("")
      : `<tr><td colspan="7" class="empty">Nenhuma cobrança mensal cadastrada.</td></tr>`;

  const planningRowsHtml =
    planningRows.length > 0
      ? planningRows
          .map((row) => {
            const kindLabel =
              row.kind === "phase" ? "Fase" : row.kind === "subphase" ? "Sub-fase" : "Tarefa";
            const taskStatus = row.taskRef ? formatTaskStatusLabel(row.taskRef.status) : "-";
            const rowFiles =
              row.kind === "phase"
                ? row.phaseRef.files
                : row.taskRef?.files || [];
            const filesLabel =
              rowFiles.length > 0
                ? rowFiles
                    .map((file) => escapeHtml(file.fileName || file.fileKey || "-"))
                    .join(", ")
                : "-";

            return `
              <tr>
                <td>
                  <div class="tree-label level-${row.level}">
                    <span class="node-icon node-${row.kind}">${row.iconLabel}</span>
                    <span>${escapeHtml(row.title)}</span>
                  </div>
                  <div class="muted">${formatTextAsHtml(row.description)}</div>
                </td>
                <td>${kindLabel}</td>
                <td>${escapeHtml(formatDate(row.startsOn))}</td>
                <td>${escapeHtml(formatDate(row.endsOn))}</td>
                <td>${escapeHtml(taskStatus)}</td>
                <td>${escapeHtml(formatPercent(row.progressPercent))}</td>
                <td>${filesLabel}</td>
              </tr>
            `;
          })
          .join("")
      : `<tr><td colspan="7" class="empty">Nenhuma fase/tarefa cadastrada.</td></tr>`;

  return `
    <!doctype html>
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <title>Projeto - ${escapeHtml(project.name)}</title>
        <style>
          @page { size: A4 landscape; margin: 12mm; }
          * { box-sizing: border-box; }
          body { margin: 0; font-family: Arial, sans-serif; color: #111827; font-size: 12px; }
          main { padding: 8px; }
          h1 { margin: 0 0 4px; font-size: 22px; }
          h2 { margin: 0 0 8px; font-size: 15px; }
          .subtitle { margin: 0; color: #4b5563; font-size: 12px; }
          .section { margin-top: 14px; }
          .summary-grid {
            margin-top: 10px;
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 8px;
          }
          .summary-item {
            border: 1px solid #d1d5db;
            border-radius: 8px;
            padding: 8px;
            background: #f9fafb;
          }
          .summary-item strong { display: block; font-size: 11px; color: #374151; margin-bottom: 4px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #d1d5db; padding: 6px; vertical-align: top; text-align: left; }
          th { background: #f3f4f6; font-weight: 700; }
          .empty { text-align: center; color: #6b7280; }
          .compact-list { margin: 0; padding-left: 16px; }
          .compact-list li + li { margin-top: 2px; }
          .muted { margin-top: 2px; color: #6b7280; font-size: 11px; }
          .tree-label { display: inline-flex; align-items: center; gap: 6px; font-weight: 600; }
          .level-1 { margin-left: 16px; }
          .level-2 { margin-left: 32px; }
          .node-icon {
            width: 18px;
            height: 18px;
            border-radius: 999px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            font-weight: 700;
          }
          .node-phase { background: #dbeafe; color: #1d4ed8; }
          .node-subphase { background: #dcfce7; color: #166534; }
          .node-task { background: #ffedd5; color: #9a3412; }
          .objective-block {
            margin-top: 10px;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            padding: 8px;
            background: #f9fafb;
          }
        </style>
      </head>
      <body>
        <main>
          <h1>${escapeHtml(project.name)}</h1>
          <p class="subtitle">Relatório completo do projeto</p>
          <p class="subtitle">Exportado em: ${escapeHtml(exportedAt)}</p>

          <section class="summary-grid">
            <div class="summary-item">
              <strong>Tipo</strong>
              ${escapeHtml(project.projectTypeName || "-")} (${escapeHtml(
                project.projectCategoryName || "Sem categoria",
              )})
            </div>
            <div class="summary-item">
              <strong>Ciclo</strong>
              ${escapeHtml(formatLifecycleTypeLabel(project.lifecycleType))}
            </div>
            <div class="summary-item">
              <strong>Status</strong>
              ${project.active ? "Ativo" : "Inativo"}
            </div>
            <div class="summary-item">
              <strong>Período</strong>
              ${escapeHtml(projectPeriod)}
            </div>
            <div class="summary-item">
              <strong>Manutenção mensal</strong>
              ${project.hasMonthlyMaintenance ? "Sim" : "Não"}
            </div>
            <div class="summary-item">
              <strong>Concluído do projeto</strong>
              ${escapeHtml(formatPercent(planningProgress.projectPercent))}
            </div>
            <div class="summary-item">
              <strong>Total de clientes</strong>
              ${escapeHtml(project.clients.length)}
            </div>
            <div class="summary-item">
              <strong>Total de receitas</strong>
              ${escapeHtml(project.revenues.length)}
            </div>
            <div class="summary-item">
              <strong>Total de cobranças mensais</strong>
              ${escapeHtml(project.monthlyCharges.length)}
            </div>
          </section>

          <section class="objective-block">
            <h2>Objetivo do projeto</h2>
            <div>${formatTextAsHtml(project.objective)}</div>
          </section>

          <section class="section">
            <h2>Clientes vinculados</h2>
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Email</th>
                  <th>Login</th>
                  <th>Papel</th>
                </tr>
              </thead>
              <tbody>
                ${clientsRowsHtml}
              </tbody>
            </table>
          </section>

          <section class="section">
            <h2>Receitas</h2>
            <table>
              <thead>
                <tr>
                  <th>Título</th>
                  <th>Valor</th>
                  <th>Prevista</th>
                  <th>Recebida</th>
                  <th>Status</th>
                  <th>Objetivo</th>
                  <th>Comprovantes</th>
                </tr>
              </thead>
              <tbody>
                ${revenuesRowsHtml}
              </tbody>
            </table>
          </section>

          <section class="section">
            <h2>Cobranças mensais</h2>
            <table>
              <thead>
                <tr>
                  <th>Título</th>
                  <th>Parcela</th>
                  <th>Valor</th>
                  <th>Dia vencimento</th>
                  <th>Início</th>
                  <th>Fim</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${monthlyChargesRowsHtml}
              </tbody>
            </table>
          </section>

          <section class="section">
            <h2>Fases e tarefas</h2>
            <table>
              <thead>
                <tr>
                  <th>Título</th>
                  <th>Tipo</th>
                  <th>Data inicial</th>
                  <th>Data final</th>
                  <th>Status</th>
                  <th>Concluído</th>
                  <th>Arquivos</th>
                </tr>
              </thead>
              <tbody>
                ${planningRowsHtml}
              </tbody>
            </table>
          </section>
        </main>
      </body>
    </html>
  `;
}
