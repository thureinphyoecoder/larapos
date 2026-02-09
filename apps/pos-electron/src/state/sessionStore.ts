import { httpClient } from "../core/api/httpClient";
import type { User } from "../core/types/contracts";

const TOKEN_KEY = "pos_auth_token";

class SessionStore {
  private token: string | null = null;
  private user: User | null = null;

  bootstrap(): void {
    this.token = localStorage.getItem(TOKEN_KEY);
    httpClient.setToken(this.token);
  }

  setSession(token: string, user: User): void {
    this.token = token;
    this.user = user;
    localStorage.setItem(TOKEN_KEY, token);
    httpClient.setToken(token);
  }

  clearSession(): void {
    this.token = null;
    this.user = null;
    localStorage.removeItem(TOKEN_KEY);
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
  }
}

export const sessionStore = new SessionStore();
