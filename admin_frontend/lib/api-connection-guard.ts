"use client";

import { adminBackendUrl } from "@/config/api";

const API_CONNECTION_ERROR_PATH = "/api-connection-error";

declare global {
  interface Window {
    __adminApiFetchGuardInstalled?: boolean;
    __adminApiOriginalFetch?: typeof fetch;
  }
}

export function redirectToApiConnectionErrorPage() {
  if (typeof window === "undefined") {
    return;
  }

  if (window.location.pathname.startsWith(API_CONNECTION_ERROR_PATH)) {
    return;
  }

  window.location.replace(API_CONNECTION_ERROR_PATH);
}

export function installApiConnectionGuard() {
  if (typeof window === "undefined") {
    return;
  }

  if (window.__adminApiFetchGuardInstalled) {
    return;
  }

  const originalFetch = window.fetch.bind(window);
  const normalizedBaseUrl = normalizeBaseURL(adminBackendUrl);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const requestURL = resolveRequestURL(input);
    const isAdminApiRequest = isBackendRequest(requestURL, normalizedBaseUrl);

    try {
      return await originalFetch(input, init);
    } catch (error) {
      if (isAdminApiRequest && !isAbortError(error)) {
        redirectToApiConnectionErrorPage();
      }
      throw error;
    }
  };

  window.__adminApiOriginalFetch = originalFetch;
  window.__adminApiFetchGuardInstalled = true;
}

function resolveRequestURL(input: RequestInfo | URL): string {
  if (typeof input === "string") {
    return input;
  }
  if (input instanceof URL) {
    return input.toString();
  }

  return input.url || "";
}

function normalizeBaseURL(value: string): string {
  return value.trim().replace(/\/+$/, "");
}

function isBackendRequest(requestURL: string, backendBaseURL: string): boolean {
  if (!requestURL || !backendBaseURL) {
    return false;
  }

  try {
    const resolvedRequestURL = new URL(requestURL, window.location.origin)
      .toString()
      .replace(/\/+$/, "");

    if (resolvedRequestURL === backendBaseURL) {
      return true;
    }

    return resolvedRequestURL.startsWith(`${backendBaseURL}/`);
  } catch {
    return false;
  }
}

function isAbortError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  return "name" in error && (error as { name?: string }).name === "AbortError";
}
