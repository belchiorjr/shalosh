"use client";

import clsx from "clsx";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { MaterialSymbol } from "@/components/material-symbol";

const mainMenuItems = [{ href: "/", label: "Painel" }];

const securitySubmenuItems = [
  { href: "/users", label: "Usuários" },
  { href: "/permissoes", label: "Permissões" },
  { href: "/perfis", label: "Perfis" },
];

interface AdminSidebarProps {
  pathname: string;
  onNavigate?: () => void;
}

export function AdminSidebar({ pathname, onNavigate }: AdminSidebarProps) {
  const isSecurityPathActive = useMemo(
    () => securitySubmenuItems.some((item) => isPathActive(pathname, item.href)),
    [pathname],
  );
  const [isSecurityMenuOpen, setIsSecurityMenuOpen] = useState(
    isSecurityPathActive,
  );

  useEffect(() => {
    if (isSecurityPathActive) {
      setIsSecurityMenuOpen(true);
    }
  }, [isSecurityPathActive]);

  return (
    <nav className="space-y-1 p-4">
      <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-[0.2em] text-foreground/60">
        Navegação
      </p>

      {mainMenuItems.map((item) => {
        const isActive = isPathActive(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={clsx(
              "flex items-center rounded-xl border px-3 py-2 text-sm transition-colors",
              isActive
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-transparent text-foreground/80 hover:border-default-300 hover:bg-default-100 hover:text-foreground",
            )}
          >
            {item.label}
          </Link>
        );
      })}

      <div className="mt-2 rounded-xl border border-default-200/80 bg-content1/40 p-2">
        <button
          type="button"
          onClick={() => setIsSecurityMenuOpen((current) => !current)}
          className="flex w-full items-center justify-between rounded-lg px-2 py-1 text-left text-xs font-semibold uppercase tracking-[0.16em] text-foreground/60 transition-colors hover:bg-default-100/70"
          aria-expanded={isSecurityMenuOpen}
          aria-controls="security-submenu"
        >
          Segurança
          <MaterialSymbol
            name={isSecurityMenuOpen ? "keyboard_arrow_down" : "keyboard_arrow_right"}
            className="text-[16px]"
          />
        </button>

        {isSecurityMenuOpen ? (
          <div id="security-submenu" className="space-y-1 pt-1">
            {securitySubmenuItems.map((item) => {
              const isActive = isPathActive(pathname, item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={clsx(
                    "flex items-center rounded-lg border px-3 py-2 text-sm transition-colors",
                    isActive
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-transparent text-foreground/80 hover:border-default-300 hover:bg-default-100 hover:text-foreground",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        ) : null}
      </div>
    </nav>
  );
}

function isPathActive(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
