import { HttpError } from "../api/httpClient";

export function mapErrorToMessage(error: unknown): string {
  if (error instanceof HttpError) {
    if (error.status === 0) return "Cannot connect to server. Check network or API URL.";
    if (error.status === 401) return "Session expired. Please sign in again.";
    if (error.status === 403) return "You do not have permission for this action.";
    if (error.status === 404) return "Requested data was not found.";
    if (error.status === 408) return "Request timeout. Please retry.";
    if (error.status >= 500) return "Server error. Please try again shortly.";

    return `${error.message} (HTTP ${error.status})`;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unexpected error.";
}
