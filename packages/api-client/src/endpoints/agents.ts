import type { AgentResponse } from "@salesagent/shared-types";
import type { ClientConfig } from "../client";

type RequestFn = <T>(path: string, options?: RequestInit) => Promise<T>;

export function createAgentEndpoints(request: RequestFn, config: ClientConfig) {
  const base = (org: string) => `/api/orgs/${org}/agents`;

  return {
    list: (orgSlug?: string) =>
      request<AgentResponse[]>(`${base(orgSlug || config.orgSlug || "")}`),

    get: (id: string, orgSlug?: string) =>
      request<AgentResponse>(`${base(orgSlug || config.orgSlug || "")}/${id}`),

    create: (data: Record<string, unknown>, orgSlug?: string) =>
      request<AgentResponse>(`${base(orgSlug || config.orgSlug || "")}`, {
        method: "POST",
        body: JSON.stringify(data),
      }),

    update: (id: string, data: Record<string, unknown>, orgSlug?: string) =>
      request<AgentResponse>(`${base(orgSlug || config.orgSlug || "")}/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
  };
}
