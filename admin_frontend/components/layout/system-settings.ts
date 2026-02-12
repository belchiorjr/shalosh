export type AdminThemeMode = "light" | "dark";

export interface AdminSystemSettings {
  theme: AdminThemeMode;
  background: string;
}

const SYSTEM_SETTINGS_STORAGE_KEY = "admin_system_settings";

export const DEFAULT_SYSTEM_BACKGROUND =
  "radial-gradient(1200px circle at 10% 10%, rgba(59,130,246,0.20), transparent 42%), radial-gradient(900px circle at 90% 15%, rgba(16,185,129,0.18), transparent 45%), linear-gradient(160deg, #f8fafc 0%, #eef2ff 48%, #ecfeff 100%)";

export const SYSTEM_BACKGROUND_PRESETS: Array<{
  id: string;
  label: string;
  value: string;
}> = [
  {
    id: "aurora",
    label: "Aurora",
    value:
      "radial-gradient(1200px circle at 10% 10%, rgba(59,130,246,0.20), transparent 42%), radial-gradient(900px circle at 90% 15%, rgba(16,185,129,0.18), transparent 45%), linear-gradient(160deg, #f8fafc 0%, #eef2ff 48%, #ecfeff 100%)",
  },
  {
    id: "sunset",
    label: "Por do Sol",
    value:
      "radial-gradient(1000px circle at 12% 12%, rgba(251,146,60,0.24), transparent 42%), radial-gradient(900px circle at 88% 15%, rgba(244,114,182,0.18), transparent 46%), linear-gradient(165deg, #fff7ed 0%, #fef3c7 46%, #ffe4e6 100%)",
  },
  {
    id: "ocean",
    label: "Oceano",
    value:
      "radial-gradient(1000px circle at 10% 10%, rgba(6,182,212,0.22), transparent 42%), radial-gradient(900px circle at 92% 18%, rgba(59,130,246,0.20), transparent 48%), linear-gradient(170deg, #ecfeff 0%, #eff6ff 52%, #f0f9ff 100%)",
  },
  {
    id: "graphite",
    label: "Grafite",
    value:
      "radial-gradient(1200px circle at 12% 12%, rgba(148,163,184,0.22), transparent 46%), radial-gradient(1000px circle at 88% 18%, rgba(99,102,241,0.18), transparent 50%), linear-gradient(165deg, #0f172a 0%, #1e293b 55%, #111827 100%)",
  },
  {
    id: "floresta",
    label: "Floresta",
    value:
      "radial-gradient(1100px circle at 12% 12%, rgba(34,197,94,0.22), transparent 44%), radial-gradient(900px circle at 88% 18%, rgba(16,185,129,0.18), transparent 50%), linear-gradient(165deg, #ecfdf5 0%, #dcfce7 50%, #d1fae5 100%)",
  },
  {
    id: "lavanda",
    label: "Lavanda",
    value:
      "radial-gradient(1000px circle at 14% 10%, rgba(167,139,250,0.22), transparent 44%), radial-gradient(900px circle at 88% 20%, rgba(244,114,182,0.18), transparent 50%), linear-gradient(170deg, #f5f3ff 0%, #ede9fe 50%, #fdf2f8 100%)",
  },
  {
    id: "duna",
    label: "Duna",
    value:
      "radial-gradient(950px circle at 10% 15%, rgba(251,191,36,0.22), transparent 44%), radial-gradient(900px circle at 90% 16%, rgba(249,115,22,0.16), transparent 50%), linear-gradient(168deg, #fffbeb 0%, #fef3c7 48%, #ffedd5 100%)",
  },
  {
    id: "polar",
    label: "Polo Norte",
    value:
      "radial-gradient(1100px circle at 12% 12%, rgba(56,189,248,0.18), transparent 44%), radial-gradient(900px circle at 88% 18%, rgba(14,116,144,0.16), transparent 50%), linear-gradient(165deg, #e0f2fe 0%, #e2e8f0 55%, #f8fafc 100%)",
  },
  {
    id: "ember",
    label: "Ember",
    value:
      "radial-gradient(1000px circle at 12% 12%, rgba(239,68,68,0.26), transparent 44%), radial-gradient(900px circle at 88% 20%, rgba(249,115,22,0.22), transparent 50%), linear-gradient(165deg, #fff1f2 0%, #fee2e2 45%, #ffedd5 100%)",
  },
  {
    id: "noite-neon",
    label: "Noite Neon",
    value:
      "radial-gradient(1000px circle at 12% 12%, rgba(14,165,233,0.30), transparent 44%), radial-gradient(900px circle at 88% 18%, rgba(99,102,241,0.26), transparent 50%), linear-gradient(165deg, #020617 0%, #0f172a 52%, #111827 100%)",
  },
  {
    id: "minimal",
    label: "Minimal",
    value:
      "radial-gradient(950px circle at 10% 10%, rgba(148,163,184,0.14), transparent 46%), radial-gradient(800px circle at 90% 20%, rgba(100,116,139,0.12), transparent 50%), linear-gradient(170deg, #f8fafc 0%, #f1f5f9 55%, #e2e8f0 100%)",
  },
  {
    id: "violeta-escuro",
    label: "Violeta Escuro",
    value:
      "radial-gradient(1100px circle at 12% 12%, rgba(147,51,234,0.28), transparent 44%), radial-gradient(900px circle at 88% 18%, rgba(59,130,246,0.24), transparent 50%), linear-gradient(165deg, #1e1b4b 0%, #312e81 50%, #111827 100%)",
  },
];

export function resolveThemeMode(input?: string | null): AdminThemeMode {
  return input === "dark" ? "dark" : "light";
}

export function loadSystemSettings(
  fallbackTheme: AdminThemeMode = "light",
): AdminSystemSettings {
  if (typeof window === "undefined") {
    return {
      theme: fallbackTheme,
      background: DEFAULT_SYSTEM_BACKGROUND,
    };
  }

  const raw = window.localStorage.getItem(SYSTEM_SETTINGS_STORAGE_KEY);
  if (!raw) {
    return {
      theme: fallbackTheme,
      background: DEFAULT_SYSTEM_BACKGROUND,
    };
  }

  try {
    const parsed = JSON.parse(raw) as Partial<AdminSystemSettings>;
    return {
      theme: resolveThemeMode(parsed.theme || fallbackTheme),
      background: parsed.background || DEFAULT_SYSTEM_BACKGROUND,
    };
  } catch {
    return {
      theme: fallbackTheme,
      background: DEFAULT_SYSTEM_BACKGROUND,
    };
  }
}

export function persistSystemSettings(settings: AdminSystemSettings): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    SYSTEM_SETTINGS_STORAGE_KEY,
    JSON.stringify(settings),
  );
}

export function applySystemBackground(background: string): void {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.style.setProperty(
    "--admin-shell-background",
    background || DEFAULT_SYSTEM_BACKGROUND,
  );
}
