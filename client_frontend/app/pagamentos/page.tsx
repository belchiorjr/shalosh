"use client";

import { Card, CardBody } from "@heroui/card";
import { Spinner } from "@heroui/spinner";
import { useEffect, useMemo, useState } from "react";

import { MaterialSymbol } from "@/components/material-symbol";
import { ClientApiError, fetchClientApi } from "@/lib/client-api";

interface ProjectRevenue {
  id: string;
  title: string;
  amount: number;
  status: string;
  expectedOn?: string;
  receivedOn?: string;
}

interface ProjectMonthlyCharge {
  id: string;
  title: string;
  installment?: string;
  amount: number;
  status: string;
  dueDay?: number;
}

interface ProjectPayments {
  projectId: string;
  projectName: string;
  projectStatus: string;
  revenues: ProjectRevenue[];
  monthlyCharges: ProjectMonthlyCharge[];
}

interface PaymentsResponse {
  projects: ProjectPayments[];
}

interface ChargeRow {
  key: string;
  projectName: string;
  title: string;
  installment: string;
  amount: number;
  dueDay?: number;
}

interface RefundRow {
  key: string;
  projectName: string;
  title: string;
  amount: number;
  expectedOn?: string;
}

export default function PagamentosPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PaymentsResponse | null>(null);

  useEffect(() => {
    void loadPayments();
  }, []);

  const loadPayments = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const payload = await fetchClientApi<PaymentsResponse>("/client/payments");
      setData(normalizePaymentsResponse(payload));
    } catch (requestError) {
      if (requestError instanceof ClientApiError) {
        setError(requestError.message);
      } else {
        setError("Falha de conexão com a API.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const paidPayments = useMemo(() => {
    if (!data) {
      return [] as ChargeRow[];
    }

    const rows: ChargeRow[] = [];
    for (const project of asArray(data.projects)) {
      for (const charge of asArray(project.monthlyCharges)) {
        if (normalizeChargeStatus(charge.status) !== "pago") {
          continue;
        }
        rows.push({
          key: `${project.projectId}:${charge.id}`,
          projectName: project.projectName,
          title: charge.title,
          installment: charge.installment || "-",
          amount: sanitizeAmount(charge.amount),
          dueDay: charge.dueDay,
        });
      }
    }
    return rows;
  }, [data]);

  const pendingDebts = useMemo(() => {
    if (!data) {
      return [] as ChargeRow[];
    }

    const rows: ChargeRow[] = [];
    for (const project of asArray(data.projects)) {
      for (const charge of asArray(project.monthlyCharges)) {
        if (normalizeChargeStatus(charge.status) !== "pendente") {
          continue;
        }
        rows.push({
          key: `${project.projectId}:${charge.id}`,
          projectName: project.projectName,
          title: charge.title,
          installment: charge.installment || "-",
          amount: sanitizeAmount(charge.amount),
          dueDay: charge.dueDay,
        });
      }
    }
    return rows;
  }, [data]);

  const possibleRefunds = useMemo(() => {
    if (!data) {
      return [] as RefundRow[];
    }

    const rows: RefundRow[] = [];
    for (const project of asArray(data.projects)) {
      for (const revenue of asArray(project.revenues)) {
        if (normalizeRevenueStatus(revenue.status) !== "pendente") {
          continue;
        }
        rows.push({
          key: `${project.projectId}:${revenue.id}`,
          projectName: project.projectName,
          title: revenue.title,
          amount: sanitizeAmount(revenue.amount),
          expectedOn: revenue.expectedOn,
        });
      }
    }
    return rows;
  }, [data]);

  const paidTotal = useMemo(
    () => paidPayments.reduce((total, item) => total + item.amount, 0),
    [paidPayments],
  );
  const debtsTotal = useMemo(
    () => pendingDebts.reduce((total, item) => total + item.amount, 0),
    [pendingDebts],
  );
  const refundsTotal = useMemo(
    () => possibleRefunds.reduce((total, item) => total + item.amount, 0),
    [possibleRefunds],
  );

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-300">
            <MaterialSymbol name="payments" className="text-[24px] text-emerald-700 dark:text-emerald-300" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground">Pagamentos</h1>
        </div>
        <p className="text-sm text-foreground/70">
          Consulte somente seus pagamentos feitos, contas pendentes e possíveis reembolsos.
        </p>
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
          <Spinner size="sm" /> Carregando pagamentos...
        </div>
      ) : null}

      {data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <MetricCard
              title="Pagamentos feitos"
              value={formatCurrency(paidTotal)}
              subtitle={`${paidPayments.length} registro(s)`}
              icon="check_circle"
              iconWrapperClassName="border-emerald-200 bg-emerald-100 dark:border-emerald-900/70 dark:bg-emerald-950/40"
              iconClassName="text-emerald-700 dark:text-emerald-300"
            />
            <MetricCard
              title="Contas que você deve"
              value={formatCurrency(debtsTotal)}
              subtitle={`${pendingDebts.length} pendente(s)`}
              icon="warning"
              iconWrapperClassName="border-rose-200 bg-rose-100 dark:border-rose-900/70 dark:bg-rose-950/40"
              iconClassName="text-rose-700 dark:text-rose-300"
            />
            <MetricCard
              title="Possíveis reembolsos"
              value={formatCurrency(refundsTotal)}
              subtitle={`${possibleRefunds.length} possibilidade(s)`}
              icon="currency_exchange"
              iconWrapperClassName="border-sky-200 bg-sky-100 dark:border-sky-900/70 dark:bg-sky-950/40"
              iconClassName="text-sky-700 dark:text-sky-300"
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <Card className="border border-default-200">
              <CardBody className="space-y-2">
                <h2 className="text-sm font-semibold text-foreground">Pagamentos feitos</h2>
                <PaymentChargeTable rows={paidPayments} emptyLabel="Nenhum pagamento encontrado." />
              </CardBody>
            </Card>

            <Card className="border border-default-200">
              <CardBody className="space-y-2">
                <h2 className="text-sm font-semibold text-foreground">Contas que você deve</h2>
                <DebtTable rows={pendingDebts} emptyLabel="Nenhuma conta pendente." />
              </CardBody>
            </Card>

            <Card className="border border-default-200">
              <CardBody className="space-y-2">
                <h2 className="text-sm font-semibold text-foreground">Possíveis reembolsos</h2>
                <RefundTable rows={possibleRefunds} emptyLabel="Nenhum possível reembolso." />
              </CardBody>
            </Card>
          </div>
        </>
      ) : null}
    </section>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
  icon,
  iconWrapperClassName,
  iconClassName,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: string;
  iconWrapperClassName: string;
  iconClassName: string;
}) {
  return (
    <Card className="border border-default-200">
      <CardBody className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground/60">
            {title}
          </p>
          <span
            className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border ${iconWrapperClassName}`}
          >
            <MaterialSymbol name={icon} className={`text-[18px] ${iconClassName}`} />
          </span>
        </div>
        <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
        <p className="mt-1 text-xs text-foreground/70">{subtitle}</p>
      </CardBody>
    </Card>
  );
}

function PaymentChargeTable({ rows, emptyLabel }: { rows: ChargeRow[]; emptyLabel: string }) {
  return (
    <div className="max-h-72 overflow-auto rounded-xl border border-default-200">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-default-200 bg-default-50 text-left text-foreground/70">
            <th className="px-2 py-2 font-medium">Projeto</th>
            <th className="px-2 py-2 font-medium">Cobrança</th>
            <th className="px-2 py-2 font-medium">Parcela</th>
            <th className="px-2 py-2 font-medium">Valor</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} className="border-b border-default-100">
              <td className="px-2 py-2">{row.projectName}</td>
              <td className="px-2 py-2">{row.title}</td>
              <td className="px-2 py-2">{row.installment}</td>
              <td className="px-2 py-2">{formatCurrency(row.amount)}</td>
            </tr>
          ))}
          {rows.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-2 py-3 text-center text-foreground/70">
                {emptyLabel}
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}

function DebtTable({ rows, emptyLabel }: { rows: ChargeRow[]; emptyLabel: string }) {
  return (
    <div className="max-h-72 overflow-auto rounded-xl border border-default-200">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-default-200 bg-default-50 text-left text-foreground/70">
            <th className="px-2 py-2 font-medium">Projeto</th>
            <th className="px-2 py-2 font-medium">Cobrança</th>
            <th className="px-2 py-2 font-medium">Venc.</th>
            <th className="px-2 py-2 font-medium">Valor</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} className="border-b border-default-100">
              <td className="px-2 py-2">{row.projectName}</td>
              <td className="px-2 py-2">
                <p>{row.title}</p>
                <p className="text-xs text-foreground/60">{row.installment}</p>
              </td>
              <td className="px-2 py-2">{formatDueDay(row.dueDay)}</td>
              <td className="px-2 py-2">{formatCurrency(row.amount)}</td>
            </tr>
          ))}
          {rows.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-2 py-3 text-center text-foreground/70">
                {emptyLabel}
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}

function RefundTable({ rows, emptyLabel }: { rows: RefundRow[]; emptyLabel: string }) {
  return (
    <div className="max-h-72 overflow-auto rounded-xl border border-default-200">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-default-200 bg-default-50 text-left text-foreground/70">
            <th className="px-2 py-2 font-medium">Projeto</th>
            <th className="px-2 py-2 font-medium">Referência</th>
            <th className="px-2 py-2 font-medium">Previsão</th>
            <th className="px-2 py-2 font-medium">Valor</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} className="border-b border-default-100">
              <td className="px-2 py-2">{row.projectName}</td>
              <td className="px-2 py-2">{row.title}</td>
              <td className="px-2 py-2">{formatDate(row.expectedOn)}</td>
              <td className="px-2 py-2">{formatCurrency(row.amount)}</td>
            </tr>
          ))}
          {rows.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-2 py-3 text-center text-foreground/70">
                {emptyLabel}
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}

function normalizeChargeStatus(value: string): string {
  const normalized = (value || "").trim().toLowerCase();
  if (normalized === "pago" || normalized === "cancelada") {
    return normalized;
  }
  return "pendente";
}

function normalizeRevenueStatus(value: string): string {
  const normalized = (value || "").trim().toLowerCase();
  if (normalized === "recebido" || normalized === "cancelado") {
    return normalized;
  }
  return "pendente";
}

function asArray<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

function normalizePaymentsResponse(payload: PaymentsResponse | null | undefined): PaymentsResponse {
  return {
    projects: asArray(payload?.projects).map(normalizeProjectPayments),
  };
}

function normalizeProjectPayments(project: ProjectPayments): ProjectPayments {
  return {
    projectId: project?.projectId || "",
    projectName: project?.projectName || "-",
    projectStatus: project?.projectStatus || "",
    revenues: asArray(project?.revenues),
    monthlyCharges: asArray(project?.monthlyCharges),
  };
}

function sanitizeAmount(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function formatDueDay(value?: number): string {
  if (!value || value < 1 || value > 31) {
    return "-";
  }
  return `Dia ${value}`;
}

function formatDate(value?: string): string {
  if (!value) {
    return "-";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("pt-BR").format(parsed);
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
}
