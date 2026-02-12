import type { HttpClient, HttpRequest, HttpResponse } from "./http-client";

export class FetchHttpClient implements HttpClient {
  async request<TResponse, TBody = unknown>(
    request: HttpRequest<TBody>,
  ): Promise<HttpResponse<TResponse>> {
    const response = await fetch(request.url, {
      method: request.method,
      headers: request.headers,
      body: request.body ? JSON.stringify(request.body) : undefined,
    });

    const contentType = response.headers.get("content-type") || "";
    let data: unknown;

    if (contentType.includes("application/json")) {
      data = await response.json();
    } else if (response.status !== 204) {
      data = await response.text();
    } else {
      data = undefined;
    }

    return {
      status: response.status,
      data: data as TResponse,
    };
  }
}
