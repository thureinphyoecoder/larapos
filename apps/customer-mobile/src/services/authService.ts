import { requestFormData, requestJson } from "../lib/http";
import type { ApiUser, AuthSession, MePayload } from "../types/domain";

type LoginResponse = {
  token: string;
  user: ApiUser;
};

export async function signIn(baseUrl: string, email: string, password: string): Promise<AuthSession> {
  const payload = await requestJson<LoginResponse>({
    baseUrl,
    path: "/auth/login",
    method: "POST",
    body: {
      email,
      password,
      device_name: "larapee-customer-mobile",
    },
  });

  return {
    token: payload.token,
    user: payload.user,
  };
}

export async function logout(baseUrl: string, token: string): Promise<void> {
  await requestJson({
    baseUrl,
    path: "/auth/logout",
    method: "POST",
    token,
  });
}

export async function fetchMe(baseUrl: string, token: string): Promise<MePayload> {
  return requestJson<MePayload>({
    baseUrl,
    path: "/auth/me",
    method: "GET",
    token,
  });
}

export type UpdateProfilePayload = {
  name: string;
  email: string;
  phone_number?: string;
  nrc_number?: string;
  address_line_1?: string;
  city?: string;
  state?: string;
  postal_code?: string;
};

export async function updateMe(baseUrl: string, token: string, payload: UpdateProfilePayload): Promise<MePayload> {
  return requestJson<MePayload>({
    baseUrl,
    path: "/auth/me",
    method: "PATCH",
    token,
    body: payload,
  });
}

export async function updateMePhoto(baseUrl: string, token: string, photoUri: string): Promise<MePayload> {
  const fileName = photoUri.split("/").pop() || `profile-${Date.now()}.jpg`;
  const ext = (fileName.split(".").pop() || "jpg").toLowerCase();
  const mimeType = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
  const formData = new FormData();
  formData.append("photo", {
    uri: photoUri,
    name: fileName,
    type: mimeType,
  } as any);

  return requestFormData<MePayload>({
    baseUrl,
    path: "/auth/me/photo",
    method: "POST",
    token,
    body: formData,
  });
}
