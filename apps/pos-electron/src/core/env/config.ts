const DEFAULT_API_BASE_URL = "http://127.0.0.1:8001/api/v1";
const DEFAULT_TIMEOUT_MS = 15000;

function normalizeApiBaseUrl(value: string | undefined): string {
  const candidate = (value ?? DEFAULT_API_BASE_URL).trim();
  return candidate.replace(/\/+$/, "");
}

function normalizeRequestTimeout(value: string | undefined): number {
  const parsed = Number(value ?? DEFAULT_TIMEOUT_MS);
  if (!Number.isFinite(parsed)) return DEFAULT_TIMEOUT_MS;
  return Math.min(60000, Math.max(3000, Math.round(parsed)));
}

export const POS_CONFIG = {
  apiBaseUrl: normalizeApiBaseUrl(import.meta.env.VITE_POS_API_BASE_URL),
  requestTimeoutMs: normalizeRequestTimeout(import.meta.env.VITE_POS_REQUEST_TIMEOUT_MS),
};
