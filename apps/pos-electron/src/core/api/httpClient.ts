import { POS_CONFIG } from "../env/config";

type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

export class HttpError extends Error {
  public readonly status: number;
  public readonly payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.payload = payload;
  }
}

export class HttpClient {
  private token: string | null = null;

  setToken(token: string | null): void {
    this.token = token;
  }

  async request<T>(method: HttpMethod, path: string, body?: unknown): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), POS_CONFIG.requestTimeoutMs);

    try {
      const response = await fetch(`${POS_CONFIG.apiBaseUrl}${path}`, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new HttpError((payload as { message?: string })?.message ?? "Request failed", response.status, payload);
      }

      return payload as T;
    } finally {
      clearTimeout(timeout);
    }
  }

  get<T>(path: string): Promise<T> {
    return this.request<T>("GET", path);
  }

  post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("POST", path, body);
  }

  patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("PATCH", path, body);
  }

  delete<T>(path: string): Promise<T> {
    return this.request<T>("DELETE", path);
  }
}

export const httpClient = new HttpClient();
