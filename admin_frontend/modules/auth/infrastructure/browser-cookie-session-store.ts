import type { AuthSessionStore } from "../application/ports/auth-session-store";
import type { AuthSession } from "../domain/entities/auth-session";

export class BrowserCookieSessionStore implements AuthSessionStore {
  save(session: AuthSession): void {
    if (typeof document === "undefined") {
      return;
    }

    const cookieParts = [
      `admin_token=${encodeURIComponent(session.token)}`,
      "Path=/",
      "SameSite=Lax",
    ];

    if (session.expiresAt && !Number.isNaN(session.expiresAt.getTime())) {
      cookieParts.push(`Expires=${session.expiresAt.toUTCString()}`);
    }

    document.cookie = cookieParts.join("; ");
    const { avatar, ...userWithoutAvatar } = session.user;
    document.cookie = [
      `admin_user=${encodeURIComponent(JSON.stringify(userWithoutAvatar))}`,
      "Path=/",
      "SameSite=Lax",
    ].join("; ");

    if (typeof window !== "undefined") {
      const rawProfile = window.localStorage.getItem("admin_account_profile");
      let currentProfile: Record<string, string> = {};
      if (rawProfile) {
        try {
          currentProfile = JSON.parse(rawProfile) as Record<string, string>;
        } catch {
          currentProfile = {};
        }
      }

      window.localStorage.setItem(
        "admin_account_profile",
        JSON.stringify({
          ...currentProfile,
          name: session.user.name,
          email: session.user.email,
          login: session.user.login,
          phone: session.user.phone || "",
          address: session.user.address || "",
          avatar: avatar || "",
        }),
      );
    }
  }

  clear(): void {
    if (typeof document === "undefined") {
      return;
    }

    document.cookie = "admin_token=; Path=/; Max-Age=0; SameSite=Lax";
    document.cookie = "admin_user=; Path=/; Max-Age=0; SameSite=Lax";

    if (typeof window !== "undefined") {
      window.localStorage.removeItem("admin_account_profile");
    }
  }
}
