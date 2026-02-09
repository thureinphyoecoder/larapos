import { httpClient } from "../core/api/httpClient";
import type { User } from "../core/types/contracts";

const TOKEN_KEY = "pos_auth_token";
const USER_KEY = "pos_auth_user";

class SessionStore {
  private token: string | null = null;
  private user: User | null = null;

  bootstrap(): void {
    this.token = localStorage.getItem(TOKEN_KEY);
    this.user = this.readUser();
    httpClient.setToken(this.token);
  }

  setSession(token: string, user: User): void {
    this.token = token;
    this.user = user;
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    httpClient.setToken(token);
  }

  clearSession(): void {
    this.token = null;
    this.user = null;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    httpClient.setToken(null);
  }

  getToken(): string | null {
    return this.token;
  }

  getUser(): User | null {
    return this.user;
  }

  setUser(user: User | null): void {
    this.user = user;
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      return;
    }

    localStorage.removeItem(USER_KEY);
  }

  private readUser(): User | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw) as User;
      if (typeof parsed?.id !== "number" || typeof parsed?.email !== "string") {
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }
}

export const sessionStore = new SessionStore();
