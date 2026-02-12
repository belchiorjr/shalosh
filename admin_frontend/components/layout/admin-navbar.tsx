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

import {
  AccountModal,
  type AccountUserData,
} from "@/components/layout/account-modal";
import { UserSettingsModal } from "@/components/layout/user-settings-modal";
import { MaterialSymbol } from "@/components/material-symbol";
import { adminBackendUrl } from "@/config/api";

interface AdminNavbarProps {
  onOpenSidebar: () => void;
}

export function AdminNavbar({ onOpenSidebar }: AdminNavbarProps) {
  const router = useRouter();
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [accountUser, setAccountUser] = useState<AccountUserData>({
    name: "Usuário",
    email: "",
    login: "usuario",
    phone: "",
    address: "",
    avatar: "",
  });
  const userInitial = useMemo(
    () => getUserInitial(accountUser.name, accountUser.login),
    [accountUser.login, accountUser.name],
  );

  useEffect(() => {
    const authUserFromCookie = readUserFromCookie();
    const authUserFromToken = readUserFromToken();
    const accountProfile = readAccountProfile();

    setAccountUser((previous) => ({
      ...previous,
      ...authUserFromCookie,
      ...authUserFromToken,
      ...accountProfile,
    }));
  }, []);

  const handleMenuAction = (key: string | number) => {
    const action = String(key);

    if (action === "logout") {
      document.cookie = "admin_token=; Path=/; Max-Age=0; SameSite=Lax";
      document.cookie = "admin_user=; Path=/; Max-Age=0; SameSite=Lax";
      localStorage.removeItem("admin_account_profile");
      router.replace("/login");
      router.refresh();
      return;
    }

    if (action === "account") {
      setIsAccountModalOpen(true);
      return;
    }

    if (action === "settings") {
      setIsSettingsModalOpen(true);
    }
  };

  const handleSaveAccount = async (
    data: AccountUserData & { password?: string },
  ): Promise<{ error?: string }> => {
    const tokenFromCookie = readCookieValue("admin_token");
    const token = tokenFromCookie ? decodeURIComponent(tokenFromCookie) : "";
    if (!token) {
      return { error: "Sessão inválida. Faça login novamente." };
    }

    try {
      const response = await fetch(`${adminBackendUrl}/auth/account`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          login: data.login,
          password: data.password || "",
          phone: data.phone || "",
          address: data.address || "",
          avatar: data.avatar || "",
        }),
      });

      const payload = (await response.json()) as
        | {
            token?: string;
            expiresAt?: string;
            user?: Partial<AccountUserData>;
            error?: string;
          }
        | undefined;

      if (!response.ok) {
        return { error: payload?.error || "Não foi possível salvar os dados." };
      }

      const updatedUser: AccountUserData = {
        name: payload?.user?.name || data.name || accountUser.name,
        email: payload?.user?.email || data.email || accountUser.email,
        login: payload?.user?.login || data.login || accountUser.login,
        phone: payload?.user?.phone || data.phone || "",
        address: payload?.user?.address || data.address || "",
        avatar: payload?.user?.avatar || data.avatar || accountUser.avatar || "",
      };

      if (payload?.token) {
        writeTokenCookie(payload.token, payload.expiresAt);
      }

      setAccountUser(updatedUser);
      saveAccountProfile(updatedUser);
      writeUserCookie(updatedUser);
      return {};
    } catch {
      return { error: "Falha de conexão com o backend." };
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-default-200 bg-content1/70 backdrop-blur-md">
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

            <Link href="/" className="flex items-center gap-2">
              <img
                src="/shalosh_marca_x.svg"
                alt="Shalosh"
                className="h-8 w-auto dark:hidden"
              />
              <img
                src="/shalosh_marca_x_dark.svg"
                alt="Shalosh"
                className="hidden h-8 w-auto dark:block"
              />
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden text-right sm:block">
              <p className="text-xs text-black/80 dark:text-white/80">
                Seja bem-vindo
              </p>
              <p className="text-sm font-semibold text-black dark:text-white">
                {accountUser.login}
              </p>
            </div>

            <div
              className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-[3px] border-default-200 bg-default-100 text-sm font-semibold text-black dark:text-white"
              title={accountUser.name}
            >
              {accountUser.avatar ? (
                <img
                  src={accountUser.avatar}
                  alt={`Avatar de ${accountUser.login}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                userInitial
              )}
            </div>

            <Dropdown placement="bottom-end">
              <DropdownTrigger>
                <Button isIconOnly variant="light" aria-label="Abrir menu do usuário">
                  <MaterialSymbol name="more_vert" className="text-[22px]" />
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label="Ações do usuário"
                onAction={handleMenuAction}
              >
                <DropdownItem
                  key="account"
                  startContent={
                    <MaterialSymbol name="account_circle" className="text-[20px]" />
                  }
                >
                  Conta
                </DropdownItem>
                <DropdownItem
                  key="settings"
                  startContent={
                    <MaterialSymbol name="settings" className="text-[20px]" />
                  }
                >
                  Configurações
                </DropdownItem>
                <DropdownItem
                  key="logout"
                  className="text-danger"
                  color="danger"
                  startContent={
                    <MaterialSymbol
                      name="logout"
                      className="text-[20px] text-danger"
                    />
                  }
                >
                  Logout
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        </div>
      </header>

      <AccountModal
        isOpen={isAccountModalOpen}
        onOpenChange={setIsAccountModalOpen}
        user={accountUser}
        onSave={handleSaveAccount}
      />

      <UserSettingsModal
        isOpen={isSettingsModalOpen}
        onOpenChange={setIsSettingsModalOpen}
      />
    </>
  );
}

function getUserInitial(name: string, login: string): string {
  const source = (name || login || "U").trim();
  return source.charAt(0).toUpperCase();
}

function readUserFromToken(): Pick<AccountUserData, "login" | "name"> | null {
  if (typeof document === "undefined") {
    return null;
  }

  const cookie = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith("admin_token="));
  if (!cookie) {
    return null;
  }

  const token = decodeURIComponent(cookie.split("=")[1] || "");
  const parts = token.split(".");
  if (parts.length < 2) {
    return null;
  }

  try {
    const payloadJSON = decodeBase64URL(parts[1]);
    const payload = JSON.parse(payloadJSON) as { login?: string; name?: string };

    return {
      login: payload.login || "",
      name: payload.name || "",
    };
  } catch {
    return null;
  }
}

function decodeBase64URL(value: string): string {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const paddingLength = normalized.length % 4;
  const padded =
    paddingLength === 0
      ? normalized
      : normalized + "=".repeat(4 - paddingLength);

  return atob(padded);
}

function writeTokenCookie(token: string, expiresAt?: string): void {
  if (typeof document === "undefined") {
    return;
  }

  const cookieParts = [
    `admin_token=${encodeURIComponent(token)}`,
    "Path=/",
    "SameSite=Lax",
  ];

  if (expiresAt) {
    const expiresDate = new Date(expiresAt);
    if (!Number.isNaN(expiresDate.getTime())) {
      cookieParts.push(`Expires=${expiresDate.toUTCString()}`);
    }
  }

  document.cookie = cookieParts.join("; ");
}

function readUserFromCookie(): AccountUserData | null {
  if (typeof document === "undefined") {
    return null;
  }

  const cookie = readCookieValue("admin_user");
  if (!cookie) {
    return null;
  }

  try {
    const parsed = JSON.parse(decodeURIComponent(cookie)) as Partial<AccountUserData>;
    return {
      name: parsed.name || "",
      email: parsed.email || "",
      login: parsed.login || "",
      phone: parsed.phone || "",
      address: parsed.address || "",
      avatar: parsed.avatar || "",
    };
  } catch {
    return null;
  }
}

function writeUserCookie(user: AccountUserData): void {
  if (typeof document === "undefined") {
    return;
  }

  const existing = readUserFromCookie();
  const merged = {
    name: user.name || existing?.name || "",
    email: user.email || existing?.email || "",
    login: user.login || existing?.login || "",
    phone: user.phone || existing?.phone || "",
    address: user.address || existing?.address || "",
  };

  document.cookie = [
    `admin_user=${encodeURIComponent(JSON.stringify(merged))}`,
    "Path=/",
    "SameSite=Lax",
  ].join("; ");
}

function readAccountProfile(): Partial<AccountUserData> | null {
  if (typeof window === "undefined") {
    return null;
  }

  const rawProfile = window.localStorage.getItem("admin_account_profile");
  if (!rawProfile) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawProfile) as Partial<AccountUserData>;
    return {
      name: parsed.name || "",
      email: parsed.email || "",
      login: parsed.login || "",
      phone: parsed.phone || "",
      address: parsed.address || "",
      avatar: parsed.avatar || "",
    };
  } catch {
    return null;
  }
}

function saveAccountProfile(profile: AccountUserData): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    "admin_account_profile",
    JSON.stringify({
      name: profile.name,
      email: profile.email,
      login: profile.login,
      phone: profile.phone || "",
      address: profile.address || "",
      avatar: profile.avatar || "",
    }),
  );
}

function readCookieValue(key: string): string | null {
  if (typeof document === "undefined") {
    return null;
  }

  const cookie = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${key}=`));
  if (!cookie) {
    return null;
  }

  return cookie.split("=")[1] || null;
}
