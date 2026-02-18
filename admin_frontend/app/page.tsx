"use client";

import { useEffect, useMemo, useState } from "react";

import { adminBackendUrl } from "@/config/api";

type DashboardProjectStatus =
  | "planejamento"
  | "andamento"
  | "concluidos"
  | "cancelados";

interface ApiError {
  error?: string;
}

interface ProjectListItem {
  id: string;
  name: string;
}

interface ProjectRevenue {
  amount: number;
  status: string;
  expectedOn?: string;
  receivedOn?: string;
  created?: string;
  updated?: string;
}

interface ProjectMonthlyCharge {
  amount: number;
  status: string;
  startsOn?: string;
  endsOn?: string;
  created?: string;
  updated?: string;
}

interface ProjectTask {
  id: string;
  status: string;
  objective?: string;
}

interface ProjectDetail {
  id: string;
  name: string;
  status: string;
  active: boolean;
  revenues: ProjectRevenue[];
  monthlyCharges: ProjectMonthlyCharge[];
  tasks: ProjectTask[];
}

interface ProjectStatusMetric {
  key: DashboardProjectStatus;
  label: string;
  colorHex: string;
  projects: number;
  percent: number;
  revenueTotal: number;
}

interface MonthlyFlowPoint {
  key: string;
  label: string;
  revenueEntries: number;
  chargePayments: number;
}

const projectStatusVisualConfig: Record<
  DashboardProjectStatus,
  { label: string; colorHex: string }
> = {
  planejamento: { label: "Planejamento", colorHex: "#2563eb" },
  andamento: { label: "Andamento", colorHex: "#f59e0b" },
  concluidos: { label: "Concluídos", colorHex: "#10b981" },
  cancelados: { label: "Cancelados", colorHex: "#ef4444" },
};

const dashboardStatusOrder: DashboardProjectStatus[] = [
  "planejamento",
  "andamento",
  "concluidos",
  "cancelados",
];

const monthlyRange = 6;

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<ProjectDetail[]>([]);

  useEffect(() => {
    void loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    const token = readTokenFromCookie();
    if (!token) {
      setError("Sessão inválida. Faça login novamente.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const projectsResponse = await fetch(`${adminBackendUrl}/projects`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const projectsPayload = (await projectsResponse.json()) as
        | ProjectListItem[]
        | ApiError;
      if (!projectsResponse.ok) {
        setError(
          getApiErrorMessage(
            projectsPayload,
            "Não foi possível carregar os projetos para o painel.",
          ),
        );
        return;
      }

      const projectList = Array.isArray(projectsPayload) ? projectsPayload : [];
      if (projectList.length === 0) {
        setProjects([]);
        return;
      }

      const detailResults = await Promise.all(
        projectList.map(async (project): Promise<ProjectDetail | null> => {
          try {
            const response = await fetch(`${adminBackendUrl}/projects/${project.id}`, {
              method: "GET",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });

            const payload = (await response.json()) as ProjectDetail | ApiError;
            if (!response.ok) {
              return null;
            }

            if (Array.isArray(payload) || !("id" in payload)) {
              return null;
            }

            return payload;
          } catch {
            return null;
          }
        }),
      );

      const details = detailResults.filter(
        (project): project is ProjectDetail => project !== null,
      );
      setProjects(details);

      if (details.length < projectList.length) {
        setError("Alguns projetos não puderam ser carregados no painel.");
      }
    } catch {
      setError("Falha de conexão com a API.");
    } finally {
      setIsLoading(false);
    }
  };

  const statusMetrics = useMemo<ProjectStatusMetric[]>(() => {
    const totalsByStatus: Record<
      DashboardProjectStatus,
      { projects: number; revenueTotal: number }
    > = {
      planejamento: { projects: 0, revenueTotal: 0 },
      andamento: { projects: 0, revenueTotal: 0 },
      concluidos: { projects: 0, revenueTotal: 0 },
      cancelados: { projects: 0, revenueTotal: 0 },
    };

    for (const project of projects) {
      const status = classifyProjectStatus(project);
      totalsByStatus[status].projects += 1;
      totalsByStatus[status].revenueTotal += sumProjectRevenues(project.revenues);
    }

    const totalProjects = projects.length;
    return dashboardStatusOrder.map((status) => ({
      key: status,
      label: projectStatusVisualConfig[status].label,
      colorHex: projectStatusVisualConfig[status].colorHex,
      projects: totalsByStatus[status].projects,
      percent:
        totalProjects > 0 ? (totalsByStatus[status].projects / totalProjects) * 100 : 0,
      revenueTotal: totalsByStatus[status].revenueTotal,
    }));
  }, [projects]);

  const monthlyFlow = useMemo<MonthlyFlowPoint[]>(() => {
    const monthKeys = buildRecentMonthKeys(monthlyRange);
    const monthMap = new Map(
      monthKeys.map((key) => [
        key,
        {
          key,
          label: formatMonthLabelFromKey(key),
          revenueEntries: 0,
          chargePayments: 0,
        },
      ]),
    );

    for (const project of projects) {
      for (const revenue of project.revenues || []) {
        if (normalizeRevenueStatus(revenue.status) !== "recebido") {
          continue;
        }

        const baseDate = pickFirstValidDate([
          revenue.receivedOn,
          revenue.expectedOn,
          revenue.updated,
          revenue.created,
        ]);
        if (!baseDate) {
          continue;
        }

        const key = monthKeyFromDate(baseDate);
        const row = monthMap.get(key);
        if (!row) {
          continue;
        }

        row.revenueEntries += sanitizeAmount(revenue.amount);
      }

      for (const charge of project.monthlyCharges || []) {
        if (normalizeMonthlyChargeStatus(charge.status) !== "pago") {
          continue;
        }

        const baseDate = pickFirstValidDate([
          charge.updated,
          charge.startsOn,
          charge.endsOn,
          charge.created,
        ]);
        if (!baseDate) {
          continue;
        }

        const key = monthKeyFromDate(baseDate);
        const row = monthMap.get(key);
        if (!row) {
          continue;
        }

        row.chargePayments += sanitizeAmount(charge.amount);
      }
    }

    return monthKeys.map((key) => monthMap.get(key)!);
  }, [projects]);

  const totalProjects = projects.length;
  const totalRevenueFromProjects = statusMetrics.reduce(
    (sum, metric) => sum + metric.revenueTotal,
    0,
  );
  const totalRevenueEntries = monthlyFlow.reduce(
    (sum, point) => sum + point.revenueEntries,
    0,
  );
  const totalChargePayments = monthlyFlow.reduce(
    (sum, point) => sum + point.chargePayments,
    0,
  );

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-default-200 bg-content1/70 p-6 backdrop-blur-md">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground/60">
          Painel
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-foreground">
          Visão de Projetos, Receitas e Cobranças
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-foreground/80">
          Acompanhe o percentual de projetos por estágio e compare entradas de receitas
          com pagamentos de cobranças.
        </p>
      </div>

      {error ? (
        <div className="rounded-2xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <div className="rounded-2xl border border-default-200 bg-content1/70 p-6 text-sm text-foreground/80">
          Carregando indicadores do painel...
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-2xl border border-default-200 bg-content1/70 p-5 backdrop-blur-md">
              <p className="text-xs uppercase tracking-[0.18em] text-foreground/60">
                Projetos no painel
              </p>
              <p className="mt-2 text-2xl font-semibold text-foreground">{totalProjects}</p>
              <p className="mt-1 text-sm text-foreground/80">Total de projetos carregados</p>
            </article>

            <article className="rounded-2xl border border-default-200 bg-content1/70 p-5 backdrop-blur-md">
              <p className="text-xs uppercase tracking-[0.18em] text-foreground/60">
                Receitas dos projetos
              </p>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                {formatCurrency(totalRevenueFromProjects)}
              </p>
              <p className="mt-1 text-sm text-foreground/80">
                Soma das receitas vinculadas aos projetos
              </p>
            </article>

            <article className="rounded-2xl border border-default-200 bg-content1/70 p-5 backdrop-blur-md">
              <p className="text-xs uppercase tracking-[0.18em] text-foreground/60">
                Entradas de receitas
              </p>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                {formatCurrency(totalRevenueEntries)}
              </p>
              <p className="mt-1 text-sm text-foreground/80">Receitas recebidas no período</p>
            </article>

            <article className="rounded-2xl border border-default-200 bg-content1/70 p-5 backdrop-blur-md">
              <p className="text-xs uppercase tracking-[0.18em] text-foreground/60">
                Pagamentos de cobranças
              </p>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                {formatCurrency(totalChargePayments)}
              </p>
              <p className="mt-1 text-sm text-foreground/80">
                Cobranças marcadas como pagas no período
              </p>
            </article>
          </div>
        </>
      )}
    </section>
  );
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

function normalizeTaskStatus(
  value: string,
): "planejada" | "iniciada" | "concluida" | "cancelada" {
  const normalizedValue = (value || "").trim().toLowerCase();
  switch (normalizedValue) {
    case "":
    case "pendente":
    case "planejada":
      return "planejada";
    case "em_andamento":
    case "iniciada":
      return "iniciada";
    case "concluida":
      return "concluida";
    case "cancelada":
      return "cancelada";
    default:
      return "planejada";
  }
}

function normalizeRevenueStatus(value: string): "pendente" | "recebido" | "cancelado" {
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

function normalizeMonthlyChargeStatus(value: string): "pendente" | "pago" | "cancelada" {
  const normalizedValue = (value || "").trim().toLowerCase();
  switch (normalizedValue) {
    case "pago":
      return "pago";
    case "cancelada":
      return "cancelada";
    case "pendente":
    default:
      return "pendente";
  }
}

function normalizeProjectStatus(
  value: string,
  active: boolean,
): "planejamento" | "andamento" | "concluido" | "cancelado" {
  const normalizedValue = (value || "").trim().toLowerCase();
  switch (normalizedValue) {
    case "cancelado":
    case "cancelada":
    case "cancelados":
      return "cancelado";
    case "concluido":
    case "concluida":
    case "concluidos":
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

function classifyProjectStatus(project: ProjectDetail): DashboardProjectStatus {
  const explicitStatus = normalizeProjectStatus(project.status, project.active);
  if (explicitStatus === "cancelado") {
    return "cancelados";
  }
  if (explicitStatus === "concluido") {
    return "concluidos";
  }

  const tasks = (project.tasks || []).filter((task) => !isSubphaseTask(task));
  if (tasks.length === 0) {
    return explicitStatus === "andamento" ? "andamento" : "planejamento";
  }

  let nonCancelledTasks = 0;
  let startedOrCompletedTasks = 0;
  let completedTasks = 0;

  for (const task of tasks) {
    const status = normalizeTaskStatus(task.status);
    if (status === "cancelada") {
      continue;
    }

    nonCancelledTasks += 1;
    if (status === "iniciada" || status === "concluida") {
      startedOrCompletedTasks += 1;
    }
    if (status === "concluida") {
      completedTasks += 1;
    }
  }

  if (nonCancelledTasks === 0) {
    return "cancelados";
  }

  if (completedTasks === nonCancelledTasks) {
    return "concluidos";
  }

  if (startedOrCompletedTasks > 0) {
    return "andamento";
  }

  return explicitStatus === "andamento" ? "andamento" : "planejamento";
}

function isSubphaseTask(task: ProjectTask): boolean {
  const objective = (task.objective || "").trim();
  const prefix = "__planner_meta__:";
  if (!objective.startsWith(prefix)) {
    return false;
  }

  try {
    const metadata = JSON.parse(objective.slice(prefix.length)) as { kind?: string };
    return metadata.kind === "subphase";
  } catch {
    return false;
  }
}

function sumProjectRevenues(revenues: ProjectRevenue[]): number {
  return revenues.reduce((sum, revenue) => sum + sanitizeAmount(revenue.amount), 0);
}

function sanitizeAmount(value: number): number {
  if (Number.isNaN(value) || !Number.isFinite(value)) {
    return 0;
  }

  return value;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(sanitizeAmount(value));
}

function pickFirstValidDate(rawValues: Array<string | undefined>): Date | null {
  for (const rawValue of rawValues) {
    const parsed = parseDateValue(rawValue);
    if (parsed) {
      return parsed;
    }
  }

  return null;
}

function parseDateValue(value?: string): Date | null {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

function buildRecentMonthKeys(months: number): string[] {
  const now = new Date();
  const keys: string[] = [];

  for (let index = months - 1; index >= 0; index -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
    keys.push(monthKeyFromDate(date));
  }

  return keys;
}

function monthKeyFromDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function formatMonthLabelFromKey(key: string): string {
  const [rawYear, rawMonth] = key.split("-");
  const year = Number.parseInt(rawYear, 10);
  const month = Number.parseInt(rawMonth, 10);
  if (Number.isNaN(year) || Number.isNaN(month)) {
    return key;
  }

  const date = new Date(year, month - 1, 1);
  const monthLabel = date
    .toLocaleDateString("pt-BR", { month: "short" })
    .replace(".", "");
  const yearLabel = String(year).slice(-2);
  return `${monthLabel}/${yearLabel}`;
}
