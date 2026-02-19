"use client";

import { Button } from "@heroui/button";
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@heroui/dropdown";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { MaterialSymbol } from "@/components/material-symbol";
import { ThemeSwitch } from "@/components/theme-switch";
import {
  clearClientSession,
  readClientProfile,
  readClientProfileFromToken,
} from "@/lib/client-auth";

interface ClientNavbarProps {
  onOpenSidebar: () => void;
}

interface ClientUserData {
  id: string;
  name: string;
  login: string;
  email: string;
  avatar?: string;
}

export function ClientNavbar({ onOpenSidebar }: ClientNavbarProps) {
  const router = useRouter();
  const [user, setUser] = useState<ClientUserData>({
    id: "",
    name: "Cliente",
    login: "cliente",
    email: "",
    avatar: "",
  });

  useEffect(() => {
    const localProfile = readClientProfile();
    const tokenProfile = readClientProfileFromToken();

    setUser((current) => ({
      ...current,
      ...tokenProfile,
      ...localProfile,
    }));
  }, []);

  const initial = useMemo(() => {
    const source = (user.name || user.login || "C").trim();
    return source.charAt(0).toUpperCase();
  }, [user.login, user.name]);

  const logout = () => {
    clearClientSession();
    router.replace("/login");
    router.refresh();
  };

  const handleMenuAction = (key: string | number) => {
    const action = String(key);

    if (action === "account") {
      router.push("/conta");
      return;
    }

    if (action === "settings") {
      router.push("/configuracoes");
      return;
    }

    if (action === "logout") {
      logout();
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-default-200 bg-content1/80 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between gap-4 px-4 md:px-6">
        <div className="flex items-center gap-3">
          <Button
            isIconOnly
            variant="light"
            className="lg:hidden"
            aria-label="Abrir menu"
            onPress={onOpenSidebar}
          >
            <MaterialSymbol name="menu" className="text-[22px]" />
          </Button>

          <Link href="/" className="flex shrink-0 items-center">
            <img
              src="/shalosh_marca_x.svg"
              alt="Shalosh"
              className="h-9 w-auto max-w-[190px] object-contain dark:hidden"
            />
            <img
              src="/shalosh_marca_x_dark.svg"
              alt="Shalosh"
              className="hidden h-9 w-auto max-w-[190px] object-contain dark:block"
            />
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-full border border-default-200 bg-content1/70 p-1 backdrop-blur">
            <ThemeSwitch />
          </div>

          <div className="hidden text-right sm:block">
            <p className="text-xs text-foreground/70">Área do cliente</p>
            <p className="text-sm font-semibold text-foreground">{user.login}</p>
          </div>

          <div
            className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-[3px] border-default-200 bg-default-100 text-sm font-semibold text-black dark:text-white"
            title={user.name}
          >
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={`Avatar de ${user.login}`}
                className="h-full w-full object-cover"
              />
            ) : (
              initial
            )}
          </div>

          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <Button isIconOnly variant="light" aria-label="Abrir menu do cliente">
                <MaterialSymbol name="more_vert" className="text-[22px]" />
              </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="Ações do cliente" onAction={handleMenuAction}>
              <DropdownItem
                key="account"
                startContent={<MaterialSymbol name="account_circle" className="text-[20px]" />}
              >
                Conta do cliente
              </DropdownItem>
              <DropdownItem
                key="settings"
                startContent={<MaterialSymbol name="settings" className="text-[20px]" />}
              >
                Configurações do sistema
              </DropdownItem>
              <DropdownItem
                key="logout"
                className="text-danger"
                color="danger"
                startContent={<MaterialSymbol name="logout" className="text-[20px] text-danger" />}
              >
                Sair
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
      </div>
    </header>
  );
}
