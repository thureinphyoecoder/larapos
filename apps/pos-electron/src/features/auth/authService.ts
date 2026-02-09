import { httpClient } from "../../core/api/httpClient";
import type { User } from "../../core/types/contracts";

type AuthResponse = {
  token: string;
  token_type: string;
  user: User;
};

export const authService = {
  login: (email: string, password: string, deviceName = "pos-desktop") =>
    httpClient.post<AuthResponse>("/auth/login", {
      email,
      password,
      device_name: deviceName,
    }),

  me: async (): Promise<User> => {
    const response = await httpClient.get<{ user: User }>("/auth/me");
    return response.user;
  },

  logout: () => httpClient.post<{ message: string }>("/auth/logout"),
};
