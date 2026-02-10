import { httpClient } from "../../core/api/httpClient";
import type { User } from "../../core/types/contracts";
import { sanitizeUser } from "../../core/validation/guards";

type AuthResponse = {
  token: string;
  token_type: string;
  user: User;
};

export const authService = {
  login: async (email: string, password: string, deviceName = "pos-desktop") => {
    const response = await httpClient.post<AuthResponse>("/auth/login", {
      email,
      password,
      device_name: deviceName,
    });

    const user = sanitizeUser(response.user);
    if (!user || !response.token) {
      throw new Error("Invalid login response.");
    }

    return {
      ...response,
      user,
    };
  },

  me: async (): Promise<User> => {
    const response = await httpClient.get<{ user: User }>("/auth/me");
    const user = sanitizeUser(response.user);
    if (!user) {
      throw new Error("Invalid profile response.");
    }

    return user;
  },

  logout: () => httpClient.post<{ message: string }>("/auth/logout"),
};
