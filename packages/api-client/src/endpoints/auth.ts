import type { AuthResponse, LoginRequest, RegisterRequest } from "@salesagent/shared-types";
import type { ClientConfig, ApiClient } from "../client";

type RequestFn = <T>(path: string, options?: RequestInit) => Promise<T>;

export function createAuthEndpoints(request: RequestFn, config: ClientConfig) {
  return {
    login: (data: LoginRequest) =>
      request<AuthResponse>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    register: (data: RegisterRequest) =>
      request<{ verifyUrl: string }>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    logout: () =>
      request<{ success: boolean }>("/api/auth/logout", { method: "POST" }),

    verifyEmail: (token: string) =>
      request<AuthResponse>(`/api/auth/verify?token=${encodeURIComponent(token)}`),
  };
}
