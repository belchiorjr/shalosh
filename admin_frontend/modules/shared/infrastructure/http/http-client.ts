export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface HttpRequest<TBody = unknown> {
  url: string;
  method: HttpMethod;
  headers?: Record<string, string>;
  body?: TBody;
}

export interface HttpResponse<TData = unknown> {
  status: number;
  data: TData;
}

export interface HttpClient {
  request<TResponse, TBody = unknown>(
    request: HttpRequest<TBody>,
  ): Promise<HttpResponse<TResponse>>;
}
