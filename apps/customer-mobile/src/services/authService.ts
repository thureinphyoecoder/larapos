import { requestFormData, requestJson } from "../lib/http";
import type { ApiUser, AuthSession, MePayload } from "../types/domain";

type LoginResponse = {
  token: string;
  user: ApiUser;
};

type RegisterPayload = {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
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

export async function register(baseUrl: string, payload: RegisterPayload): Promise<AuthSession> {
  const response = await requestJson<LoginResponse>({
    baseUrl,
    path: "/auth/register",
    method: "POST",
    body: {
      name: payload.name,
      email: payload.email,
      password: payload.password,
      password_confirmation: payload.password_confirmation,
      device_name: "larapee-customer-mobile",
    },
  });

  return {
    token: response.token,
    user: response.user,
  };
}

export async function requestPasswordReset(baseUrl: string, email: string): Promise<{ message: string }> {
  return requestJson<{ message: string }>({
    baseUrl,
    path: "/auth/forgot-password",
    method: "POST",
    body: { email },
  });
}

export async function resendEmailVerification(baseUrl: string, token: string): Promise<{ message: string; already_verified: boolean }> {
  return requestJson<{ message: string; already_verified: boolean }>({
    baseUrl,
    path: "/auth/email/verification-notification",
    method: "POST",
    token,
  });
}

export async function resendEmailVerificationByEmail(baseUrl: string, email: string): Promise<{ message: string }> {
  return requestJson<{ message: string }>({
    baseUrl,
    path: "/auth/email/verification-notification/request",
    method: "POST",
    body: { email },
  });
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
