import { requestJson } from "../lib/http";
import type { SupportMessagesPayload } from "../types/domain";

export async function fetchSupportMessages(baseUrl: string, token: string, page = 1): Promise<SupportMessagesPayload> {
  return requestJson<SupportMessagesPayload>({
    baseUrl,
    path: `/support/messages?message_page=${page}`,
    method: "GET",
    token,
  });
}

export async function sendSupportMessage(baseUrl: string, token: string, message: string): Promise<void> {
  await requestJson({
    baseUrl,
    path: "/support/messages",
    method: "POST",
    token,
    body: {
      message,
    },
  });
}
