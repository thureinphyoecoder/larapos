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
  method: "GET" | "POST" | "PATCH";
  token?: string;
  body?: unknown;
  timeoutMs?: number;
  isFormData?: boolean;
};

export async function requestJson<T>(options: RequestOptions): Promise<T> {
  const {
    baseUrl,
    path,
    method,
    token,
    body,
    timeoutMs = 15000,
    isFormData = false,
  } = options;

  const controller = new AbortController();
  let timeoutHandle: ReturnType<typeof setTimeout> | null = null;
  let timeoutTriggered = false;

  try {
    const headers: Record<string, string> = {
      Accept: "application/json",
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    if (!isFormData) {
      headers["Content-Type"] = "application/json";
    }

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutHandle = setTimeout(() => {
        timeoutTriggered = true;
        controller.abort();
        reject(new ApiError("ဆာဗာကို ဆက်သွယ်ချိန်ကုန်သွားပါတယ်။ API URL နဲ့ network ကို စစ်ပါ။", 0));
      }, timeoutMs);
    });

    const response = await Promise.race([
      fetch(`${stripTrailingSlash(baseUrl)}${path}`, {
      method,
      headers,
      body: body
        ? isFormData
          ? (body as BodyInit)
          : JSON.stringify(body)
        : undefined,
      signal: controller.signal,
      }),
      timeoutPromise,
    ]);

    if (!(response instanceof Response)) {
      throw new ApiError("ဆာဗာချိတ်ဆက်မှု မအောင်မြင်ပါ။", 0);
    }

    const payload = await response.json().catch(() => ({}));
    if (response.ok) {
      return payload as T;
    }

    const message = extractMessage(payload) ?? `Request failed (${response.status})`;
    throw new ApiError(message, response.status);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (!timeoutTriggered && error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError("ဆာဗာကို ဆက်သွယ်ချိန်ကုန်သွားပါတယ်။ API URL နဲ့ network ကို စစ်ပါ။", 0);
    }

    throw new ApiError("ဆာဗာချိတ်ဆက်မှု မအောင်မြင်ပါ။ API URL မှန်/မမှန် စစ်ပါ။", 0);
  } finally {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
  }
}

function extractMessage(payload: any): string | null {
  if (payload && typeof payload.message === "string" && payload.message.trim()) {
    return payload.message;
  }

  const errors = payload?.errors;
  if (errors && typeof errors === "object") {
    const firstKey = Object.keys(errors)[0];
    const firstError = firstKey ? errors[firstKey] : null;

    if (Array.isArray(firstError) && firstError[0]) {
      return String(firstError[0]);
    }

    if (typeof firstError === "string") {
      return firstError;
    }
  }

  return null;
}

function stripTrailingSlash(url: string): string {
  return url.replace(/\/$/, "");
}
