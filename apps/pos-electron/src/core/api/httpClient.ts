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
    try {
      return await this.requestOnce<T>(method, path, body);
    } catch (error) {
      if (method !== "GET") throw error;

      // Single retry for idempotent GET on transient network failures.
      if (error instanceof HttpError && (error.status === 0 || error.status === 408)) {
        return this.requestOnce<T>(method, path, body);
      }

      throw error;
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

  private async requestOnce<T>(method: HttpMethod, path: string, body?: unknown): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), POS_CONFIG.requestTimeoutMs);

    try {
      const response = await fetch(`${POS_CONFIG.apiBaseUrl}${path}`, {
        method,
        headers: {
          "Content-Type": "application/json",
          "X-Request-Id": this.generateRequestId(),
          ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      const payload = await this.parsePayload(response);
      if (!response.ok) {
        const message = this.extractErrorMessage(payload);
        throw new HttpError(message, response.status, payload);
      }

      return payload as T;
    } catch (error) {
      if (error instanceof HttpError) throw error;

      if (error instanceof DOMException && error.name === "AbortError") {
        throw new HttpError(`Request timeout after ${POS_CONFIG.requestTimeoutMs}ms`, 408, { path, method });
      }

      throw new HttpError(`Network error: cannot reach API at ${POS_CONFIG.apiBaseUrl}`, 0, { path, method });
    } finally {
      clearTimeout(timeout);
    }
  }

  private async parsePayload(response: Response): Promise<unknown> {
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      return response.json().catch(() => ({}));
    }

    const text = await response.text().catch(() => "");
    return text ? { message: text } : {};
  }

  private extractErrorMessage(payload: unknown): string {
    if (payload && typeof payload === "object") {
      const candidate = payload as { message?: unknown };
      if (typeof candidate.message === "string" && candidate.message.trim().length > 0) {
        return candidate.message;
      }
    }

    return "Request failed";
  }

  private generateRequestId(): string {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }

    return `req-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }
}

export const httpClient = new HttpClient();
