"use client";

import clsx from "clsx";
import Link from "next/link";

import { MaterialSymbol } from "@/components/material-symbol";

interface ClientSidebarProps {
  pathname: string;
  onNavigate?: () => void;
  showProjects?: boolean;
}

const items = [
  {
    href: "/",
    label: "Home",
    icon: "dashboard",
    iconClassName: "text-default-700 dark:text-default-300",
  },
  {
    href: "/projetos",
    label: "Projetos",
    icon: "workspaces",
    iconClassName: "text-sky-700 dark:text-sky-300",
  },
  {
    href: "/pagamentos",
    label: "Pagamentos",
    icon: "payments",
    iconClassName: "text-emerald-700 dark:text-emerald-300",
  },
  {
    href: "/solicitacoes",
    label: "Solicitações",
    icon: "support_agent",
    iconClassName: "text-amber-700 dark:text-amber-300",
  },
  {
    href: "/conta",
    label: "Conta",
    icon: "badge",
    iconClassName: "text-violet-700 dark:text-violet-300",
  },
  {
    href: "/configuracoes",
    label: "Configurações",
    icon: "settings",
    iconClassName: "text-rose-700 dark:text-rose-300",
  },
];

export function ClientSidebar({
  pathname,
  onNavigate,
  showProjects = true,
}: ClientSidebarProps) {
  const visibleItems = showProjects ? items : items.filter((item) => item.href !== "/projetos");

  return (
    <nav className="space-y-1 p-4">
      <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-[0.2em] text-foreground/60">
        Portal do Cliente
      </p>

      {visibleItems.map((item) => {
        const isActive = isPathActive(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={clsx(
              "flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors",
              isActive
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-transparent text-foreground/80 hover:border-default-300 hover:bg-default-100 hover:text-foreground",
            )}
          >
            <MaterialSymbol name={item.icon} className={clsx("text-[18px]", item.iconClassName)} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function isPathActive(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
