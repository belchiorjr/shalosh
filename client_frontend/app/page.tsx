"use client";

import { Card, CardBody } from "@heroui/card";
import Link from "next/link";

import { MaterialSymbol } from "@/components/material-symbol";

interface AppMenuItem {
  href: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  iconWrapperClassName: string;
  iconClassName: string;
}

const appMenuItems: AppMenuItem[] = [
  {
    href: "/projetos",
    title: "Projetos",
    description: "Acompanhe fases, tarefas e comentários.",
    icon: "workspaces",
    category: "Execução",
    iconWrapperClassName:
      "border-sky-200 bg-sky-100 text-sky-700 dark:border-sky-900/70 dark:bg-sky-950/40 dark:text-sky-300",
    iconClassName: "text-sky-700 dark:text-sky-300",
  },
  {
    href: "/pagamentos",
    title: "Pagamentos",
    description: "Consulte cobranças, débitos e histórico.",
    icon: "payments",
    category: "Financeiro",
    iconWrapperClassName:
      "border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-300",
    iconClassName: "text-emerald-700 dark:text-emerald-300",
  },
  {
    href: "/solicitacoes",
    title: "Solicitações",
    description: "Abra e acompanhe solicitações de serviço.",
    icon: "support_agent",
    category: "Atendimento",
    iconWrapperClassName:
      "border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-300",
    iconClassName: "text-amber-700 dark:text-amber-300",
  },
  {
    href: "/conta",
    title: "Conta",
    description: "Atualize dados do cliente e avatar.",
    icon: "badge",
    category: "Perfil",
    iconWrapperClassName:
      "border-violet-200 bg-violet-100 text-violet-700 dark:border-violet-900/70 dark:bg-violet-950/40 dark:text-violet-300",
    iconClassName: "text-violet-700 dark:text-violet-300",
  },
  {
    href: "/configuracoes",
    title: "Configurações",
    description: "Preferências do sistema e notificações.",
    icon: "settings",
    category: "Sistema",
    iconWrapperClassName:
      "border-rose-200 bg-rose-100 text-rose-700 dark:border-rose-900/70 dark:bg-rose-950/40 dark:text-rose-300",
    iconClassName: "text-rose-700 dark:text-rose-300",
  },
];

export default function HomeMenuPage() {
  return (
    <section className="space-y-6">
      <Card className="border border-default-200 bg-content1/70 backdrop-blur-sm">
        <CardBody className="space-y-2">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground/55">
              Portal do Cliente
            </p>
            <h1 className="text-3xl font-semibold text-foreground">Home</h1>
            <p className="text-sm text-foreground/70">
              Acessos rápidos para acompanhar projetos, financeiro e preferências da conta.
            </p>
          </div>
        </CardBody>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {appMenuItems.map((item) => (
          <Link key={item.href} href={item.href} className="block h-full">
            <Card className="group h-full border border-default-200 bg-content1/80 transition-all duration-200 hover:-translate-y-0.5 hover:border-default-300 hover:shadow-[0_1px_1px_rgba(0,0,0,0.08)]">
              <CardBody className="flex min-h-[150px] justify-between">
                <div className="space-y-3">
                  <div
                    className={`inline-flex h-12 w-12 items-center justify-center rounded-xl border ${item.iconWrapperClassName}`}
                  >
                    <MaterialSymbol name={item.icon} className={`text-[26px] ${item.iconClassName}`} />
                  </div>

                  <div>
                    <h2 className="text-lg font-semibold text-foreground">{item.title}</h2>
                    <p className="text-sm text-foreground/70">{item.description}</p>
                  </div>
                </div>

                <div className="flex items-end justify-end">
                  <span className="inline-flex h-8 w-auto items-center gap-1 rounded-full border border-default-200 bg-default-100 px-2 text-xs font-medium text-foreground/75">
                    {item.category}
                    <MaterialSymbol name="arrow_forward" className="text-[18px]" />
                  </span>
                </div>
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
