import type { CampaignResponse } from "@salesagent/shared-types";
import type { ClientConfig } from "../client";

type RequestFn = <T>(path: string, options?: RequestInit) => Promise<T>;

export function createCampaignEndpoints(request: RequestFn, config: ClientConfig) {
  const base = (org: string) => `/api/orgs/${org}/campaigns`;

  return {
    list: (params?: { orgSlug?: string; status?: string }) => {
      const org = params?.orgSlug || config.orgSlug || "";
      const searchParams = new URLSearchParams();
      if (params?.status) searchParams.set("status", params.status);
      const qs = searchParams.toString();
      return request<CampaignResponse[]>(`${base(org)}${qs ? `?${qs}` : ""}`);
    },

    get: (id: string, orgSlug?: string) =>
      request<CampaignResponse>(`${base(orgSlug || config.orgSlug || "")}/${id}`),

    create: (data: Record<string, unknown>, orgSlug?: string) =>
      request<CampaignResponse>(`${base(orgSlug || config.orgSlug || "")}`, {
        method: "POST",
        body: JSON.stringify(data),
      }),

    update: (id: string, data: Record<string, unknown>, orgSlug?: string) =>
      request<CampaignResponse>(`${base(orgSlug || config.orgSlug || "")}/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),

    start: (id: string, orgSlug?: string) =>
      request(`${base(orgSlug || config.orgSlug || "")}/${id}/start`, {
        method: "POST",
      }),
  };
}
