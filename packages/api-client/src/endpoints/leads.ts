import type { LeadResponse, LeadListResponse, CreateLeadRequest, UpdateLeadRequest } from "@salesagent/shared-types";
import type { ClientConfig } from "../client";

type RequestFn = <T>(path: string, options?: RequestInit) => Promise<T>;

export function createLeadEndpoints(request: RequestFn, config: ClientConfig) {
  const base = (org: string) => `/api/orgs/${org}/leads`;

  return {
    list: (params?: {
      orgSlug?: string;
      page?: number;
      limit?: number;
      search?: string;
      stage?: string;
    }) => {
      const org = params?.orgSlug || config.orgSlug || "";
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set("page", String(params.page));
      if (params?.limit) searchParams.set("limit", String(params.limit));
      if (params?.search) searchParams.set("search", params.search);
      if (params?.stage) searchParams.set("stage", params.stage);
      const qs = searchParams.toString();
      return request<LeadListResponse>(`${base(org)}${qs ? `?${qs}` : ""}`);
    },

    get: (id: string, orgSlug?: string) =>
      request<LeadResponse>(`${base(orgSlug || config.orgSlug || "")}/${id}`),

    create: (data: CreateLeadRequest, orgSlug?: string) =>
      request<LeadResponse>(`${base(orgSlug || config.orgSlug || "")}`, {
        method: "POST",
        body: JSON.stringify(data),
      }),

    update: (id: string, data: UpdateLeadRequest, orgSlug?: string) =>
      request<LeadResponse>(`${base(orgSlug || config.orgSlug || "")}/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),

    delete: (id: string, orgSlug?: string) =>
      request<{ success: boolean }>(`${base(orgSlug || config.orgSlug || "")}/${id}`, {
        method: "DELETE",
      }),
  };
}
