import type { SecurityTokenProvider } from "../application/ports/security-token-provider";

export class BrowserCookieSecurityTokenProvider implements SecurityTokenProvider {
  getToken(): string {
    if (typeof document === "undefined") {
      return "";
    }

    const cookie = document.cookie
      .split("; ")
      .find((entry) => entry.startsWith("admin_token="));
    if (!cookie) {
      return "";
    }

    return decodeURIComponent(cookie.split("=")[1] || "").trim();
  }
}

