export interface ClientProfile {
  id: string;
  name: string;
  email: string;
  login: string;
  avatar?: string;
}

const CLIENT_PROFILE_STORAGE_KEY = "client_account_profile";

export function readClientTokenFromCookie(): string {
  if (typeof document === "undefined") {
    return "";
  }

  const match = document.cookie.match(/(?:^|;\s*)client_token=([^;]+)/);
  if (!match) {
    return "";
  }

  try {
    return decodeURIComponent(match[1] || "").trim();
  } catch {
    return "";
  }
}

export function writeClientTokenCookie(token: string, expiresAt?: string): void {
  if (typeof document === "undefined") {
    return;
  }

  const normalizedToken = token.trim();
  if (!normalizedToken) {
    return;
  }

  const parts = [
    `client_token=${encodeURIComponent(normalizedToken)}`,
    "Path=/",
    "SameSite=Lax",
  ];

  const expires = parseOptionalDate(expiresAt);
  if (expires) {
    parts.push(`Expires=${expires.toUTCString()}`);
  }

  document.cookie = parts.join("; ");
}

export function clearClientSession(): void {
  if (typeof document !== "undefined") {
    document.cookie = "client_token=; Path=/; Max-Age=0; SameSite=Lax";
  }
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(CLIENT_PROFILE_STORAGE_KEY);
  }
}

export function readClientProfile(): ClientProfile | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(CLIENT_PROFILE_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<ClientProfile>;
    if (!parsed.id || !parsed.login) {
      return null;
    }

    return {
      id: parsed.id,
      name: parsed.name || "",
      email: parsed.email || "",
      login: parsed.login,
      avatar: parsed.avatar || "",
    };
  } catch {
    return null;
  }
}

export function saveClientProfile(profile: ClientProfile): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(CLIENT_PROFILE_STORAGE_KEY, JSON.stringify(profile));
}

export function readClientProfileFromToken(): Partial<ClientProfile> {
  const token = readClientTokenFromCookie();
  if (!token) {
    return {};
  }

  const parts = token.split(".");
  if (parts.length < 2) {
    return {};
  }

  try {
    const payloadJson = decodeBase64URL(parts[1]);
    const payload = JSON.parse(payloadJson) as { sub?: string; login?: string; name?: string };

    return {
      id: (payload.sub || "").trim(),
      login: (payload.login || "").trim(),
      name: (payload.name || "").trim(),
    };
  } catch {
    return {};
  }
}

function decodeBase64URL(value: string): string {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const paddingLength = normalized.length % 4;
  const padded = paddingLength === 0 ? normalized : normalized + "=".repeat(4 - paddingLength);

  return atob(padded);
}

function parseOptionalDate(value?: string): Date | null {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}
