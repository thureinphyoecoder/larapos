import { requestJson } from "../lib/http";
import type { ApiUser, SalaryPreview, StaffProfile } from "../types/domain";

type LoginResponse = {
  token: string;
  user: ApiUser;
};

type MeResponse = {
  user: ApiUser;
  profile?: StaffProfile | null;
  salary_preview?: SalaryPreview | null;
};

export const authService = {
  login(baseUrl: string, email: string, password: string): Promise<LoginResponse> {
    return requestJson<LoginResponse>({
      baseUrl,
      path: "/auth/login",
      method: "POST",
      body: {
        email,
        password,
        device_name: "delivery-mobile",
      },
    });
  },

  me(baseUrl: string, token: string): Promise<MeResponse> {
    return requestJson<MeResponse>({
      baseUrl,
      path: "/auth/me",
      method: "GET",
      token,
    });
  },

  logout(baseUrl: string, token: string): Promise<{ message: string }> {
    return requestJson<{ message: string }>({
      baseUrl,
      path: "/auth/logout",
      method: "POST",
      token,
      body: {},
    });
  },
};
