"use client";

import clsx from "clsx";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { ClientNavbar } from "@/components/layout/client-navbar";
import { ClientSidebar } from "@/components/layout/client-sidebar";
import { fetchClientApi } from "@/lib/client-api";

interface ClientShellProps {
  children: React.ReactNode;
}

export function ClientShell({ children }: ClientShellProps) {
  const pathname = usePathname() || "";
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showProjects, setShowProjects] = useState(true);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    let isMounted = true;

    const loadProjectsVisibility = async () => {
      if (pathname.startsWith("/login")) {
        return;
      }

      try {
        const payload = await fetchClientApi<unknown[]>("/client/projects");
        if (!isMounted) {
          return;
        }
        setShowProjects(Array.isArray(payload) && payload.length > 0);
      } catch {
        if (!isMounted) {
          return;
        }
        setShowProjects(true);
      }
    };

    void loadProjectsVisibility();

    return () => {
      isMounted = false;
    };
  }, [pathname]);

  if (pathname.startsWith("/login")) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background/80">
      <ClientNavbar onOpenSidebar={() => setIsSidebarOpen(true)} />

      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-72 shrink-0 border-r border-default-200 bg-content1/60 backdrop-blur-md lg:block">
          <ClientSidebar pathname={pathname} showProjects={showProjects} />
        </aside>

        <main className="flex-1 overflow-y-auto px-5 py-6 md:px-8">{children}</main>
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
            "absolute left-0 top-0 h-full w-72 border-r border-default-200 bg-content1/90 backdrop-blur-md transition-transform",
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
          <ClientSidebar
            pathname={pathname}
            onNavigate={() => setIsSidebarOpen(false)}
            showProjects={showProjects}
          />
        </aside>
      </div>
    </div>
  );
}
