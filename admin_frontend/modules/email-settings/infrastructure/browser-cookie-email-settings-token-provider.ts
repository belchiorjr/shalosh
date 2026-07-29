import type { EmailSettingsTokenProvider } from "../application/ports/email-settings-token-provider";

export class BrowserCookieEmailSettingsTokenProvider
  implements EmailSettingsTokenProvider
{
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
