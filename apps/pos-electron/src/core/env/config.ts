export const POS_CONFIG = {
  apiBaseUrl: import.meta.env.VITE_POS_API_BASE_URL ?? "http://127.0.0.1:8000/api/v1",
  requestTimeoutMs: Number(import.meta.env.VITE_POS_REQUEST_TIMEOUT_MS ?? 15000),
};
