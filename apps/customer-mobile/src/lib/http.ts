export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

type RequestOptions = {
  baseUrl: string;
  path: string;
  method: "GET" | "POST" | "PATCH" | "DELETE";
  token?: string;
  body?: unknown;
  timeoutMs?: number;
};

type FormRequestOptions = {
  baseUrl: string;
  path: string;
  method: "POST" | "PATCH";
  token?: string;
  body: FormData;
  timeoutMs?: number;
};

export async function requestJson<T>(options: RequestOptions): Promise<T> {
  const { baseUrl, path, method, token, body, timeoutMs = 15000 } = options;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${stripTrailingSlash(baseUrl)}${path}`, {
      method,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message = extractMessage(payload) || `Request failed (${response.status})`;
      throw new ApiError(message, response.status);
    }

    return payload as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;

    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError("Network timeout", 0);
    }

    throw new ApiError("Network unavailable", 0);
  } finally {
    clearTimeout(timeout);
  }
}

export async function requestFormData<T>(options: FormRequestOptions): Promise<T> {
  const { baseUrl, path, method, token, body, timeoutMs = 20000 } = options;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${stripTrailingSlash(baseUrl)}${path}`, {
      method,
      headers: {
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body,
      signal: controller.signal,
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message = extractMessage(payload) || `Request failed (${response.status})`;
      throw new ApiError(message, response.status);
    }

    return payload as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;

    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError("Network timeout", 0);
    }

    throw new ApiError("Network unavailable", 0);
  } finally {
    clearTimeout(timeout);
  }
}

function extractMessage(payload: any): string | null {
  if (payload && typeof payload.message === "string" && payload.message.trim()) {
    return payload.message;
  }

  if (payload?.errors && typeof payload.errors === "object") {
    const firstKey = Object.keys(payload.errors)[0];
    const firstError = firstKey ? payload.errors[firstKey] : null;

    if (Array.isArray(firstError) && firstError[0]) {
      return String(firstError[0]);
    }

    if (typeof firstError === "string") {
      return firstError;
    }
  }

  return null;
}

function stripTrailingSlash(value: string): string {
  return value.replace(/\/$/, "");
}
