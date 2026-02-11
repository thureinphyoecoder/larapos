import { requestFormData, requestJson } from "../lib/http";
import type { SupportMessagesPayload } from "../types/domain";

export async function fetchSupportMessages(baseUrl: string, token: string, page = 1): Promise<SupportMessagesPayload> {
  const payload = await requestJson<SupportMessagesPayload>({
    baseUrl,
    path: `/support/messages?message_page=${page}`,
    method: "GET",
    token,
  });

  return {
    ...payload,
    messages: (payload.messages || []).map((message) => ({
      ...message,
      attachment_url: toAbsoluteUrl(baseUrl, message.attachment_url),
    })),
  };
}

export async function sendSupportMessage(baseUrl: string, token: string, message: string, imageUri?: string | null): Promise<void> {
  const formData = new FormData();

  if (message.trim()) {
    formData.append("message", message.trim());
  }

  if (imageUri) {
    const fileName = imageUri.split("/").pop() || `support-${Date.now()}.jpg`;
    formData.append("image", {
      uri: imageUri,
      name: fileName,
      type: "image/jpeg",
    } as any);
  }

  await requestFormData({
    baseUrl,
    path: "/support/messages",
    method: "POST",
    token,
    body: formData,
  });
}

function toAbsoluteUrl(baseUrl: string, value?: string | null): string | null {
  if (!value) {
    return null;
  }

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  const normalized = baseUrl.replace(/\/+$/, "");
  const index = normalized.indexOf("/api/");
  const origin = index >= 0 ? normalized.slice(0, index) : normalized;
  const path = value.startsWith("/") ? value : `/${value}`;
  return `${origin}${path}`;
}
