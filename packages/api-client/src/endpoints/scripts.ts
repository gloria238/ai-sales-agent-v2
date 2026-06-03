import type { ScriptResponse } from "@salesagent/shared-types";
import type { ClientConfig } from "../client";

type RequestFn = <T>(path: string, options?: RequestInit) => Promise<T>;

export function createScriptEndpoints(request: RequestFn, config: ClientConfig) {
  const base = (org: string) => `/api/orgs/${org}/scripts`;

  return {
    list: (orgSlug?: string) =>
      request<ScriptResponse[]>(`${base(orgSlug || config.orgSlug || "")}`),

    get: (id: string, orgSlug?: string) =>
      request<ScriptResponse>(`${base(orgSlug || config.orgSlug || "")}/${id}`),

    install: (scriptSlug: string, orgSlug?: string) =>
      request<ScriptResponse>(`${base(orgSlug || config.orgSlug || "")}/install`, {
        method: "POST",
        body: JSON.stringify({ slug: scriptSlug }),
      }),

    generate: (data: {
      description: string;
      industry?: string;
      targetPersona?: string;
      goal?: string;
      channel?: string;
    }, orgSlug?: string) =>
      request(`${base(orgSlug || config.orgSlug || "")}/ai/generate-script`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
  };
}
