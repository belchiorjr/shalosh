"use client";

import clsx from "clsx";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { AdminFooter } from "./admin-footer";
import { AdminNavbar } from "./admin-navbar";
import { AdminSidebar } from "./admin-sidebar";
import {
  applySystemBackground,
  loadSystemSettings,
} from "./system-settings";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    const settings = loadSystemSettings("light");
    applySystemBackground(settings.background);
  }, []);

  if (pathname.startsWith("/login")) {
    return <>{children}</>;
  }

  return (
    <div
      className="flex min-h-screen flex-col"
      style={{
        backgroundColor: "var(--admin-shell-base-color)",
        backgroundImage:
          "linear-gradient(var(--admin-shell-overlay), var(--admin-shell-overlay)), var(--admin-shell-background)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <AdminNavbar onOpenSidebar={() => setIsSidebarOpen(true)} />

      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-64 shrink-0 border-r border-default-200 bg-content1/70 backdrop-blur-md lg:block">
          <AdminSidebar pathname={pathname} />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <main className="flex-1 overflow-y-auto px-6 py-6 md:px-8">
            {children}
          </main>
          <AdminFooter />
        </div>
      </div>

      <div
        className={clsx(
          "fixed inset-0 z-50 lg:hidden",
          isSidebarOpen ? "pointer-events-auto" : "pointer-events-none",
        )}
      >
        <button
          aria-label="Fechar menu"
          className={clsx(
            "absolute inset-0 bg-black/30 transition-opacity",
            isSidebarOpen ? "opacity-100" : "opacity-0",
          )}
          onClick={() => setIsSidebarOpen(false)}
        />

        <aside
          className={clsx(
            "absolute left-0 top-0 h-full w-72 border-r border-default-200 bg-content1/70 backdrop-blur-md transition-transform",
            isSidebarOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex h-16 items-center justify-between border-b border-default-200 px-4">
            <p className="text-sm font-semibold text-foreground">Menu</p>
            <button
              className="text-sm text-foreground/80"
              onClick={() => setIsSidebarOpen(false)}
            >
              Fechar
            </button>
          </div>
          <AdminSidebar
            pathname={pathname}
            onNavigate={() => setIsSidebarOpen(false)}
          />
        </aside>
      </div>
    </div>
  );
}
