import { adminBackendUrl } from "@/config/api";
import { readClientTokenFromCookie } from "@/lib/client-auth";

export class ClientApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

interface ApiErrorPayload {
  error?: string;
}

export async function fetchClientApi<TResponse>(
  path: string,
  init: RequestInit = {},
  options: { auth?: boolean } = { auth: true },
): Promise<TResponse> {
  const authRequired = options.auth !== false;
  const headers = new Headers(init.headers || {});

  if (!headers.has("Content-Type") && init.body && typeof init.body === "string") {
    headers.set("Content-Type", "application/json");
  }

  if (authRequired) {
    const token = readClientTokenFromCookie();
    if (!token) {
      throw new ClientApiError(401, "Sessão inválida. Faça login novamente.");
    }

    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${adminBackendUrl}${path}`, {
    ...init,
    headers,
  });

  const payload = (await response.json().catch(() => ({}))) as
    | TResponse
    | ApiErrorPayload;

  if (!response.ok) {
    const message =
      typeof payload === "object" && payload && "error" in payload
        ? (payload.error || "Erro na requisição")
        : "Erro na requisição";
    throw new ClientApiError(response.status, message);
  }

  return payload as TResponse;
}
