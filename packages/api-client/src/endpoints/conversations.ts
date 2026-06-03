import type { ConversationResponse } from "@salesagent/shared-types";
import type { ClientConfig } from "../client";

type RequestFn = <T>(path: string, options?: RequestInit) => Promise<T>;

export function createConversationEndpoints(request: RequestFn, config: ClientConfig) {
  const base = (org: string) => `/api/orgs/${org}/conversations`;

  return {
    list: (params?: {
      orgSlug?: string;
      page?: number;
      status?: string;
      search?: string;
    }) => {
      const org = params?.orgSlug || config.orgSlug || "";
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set("page", String(params.page));
      if (params?.status) searchParams.set("status", params.status);
      if (params?.search) searchParams.set("search", params.search);
      const qs = searchParams.toString();
      return request<ConversationResponse[]>(`${base(org)}${qs ? `?${qs}` : ""}`);
    },

    get: (id: string, orgSlug?: string) =>
      request<ConversationResponse>(`${base(orgSlug || config.orgSlug || "")}/${id}`),

    sendMessage: (conversationId: string, data: { content: string; channel: string }, orgSlug?: string) =>
      request(`${base(orgSlug || config.orgSlug || "")}/${conversationId}/messages`, {
        method: "POST",
        body: JSON.stringify(data),
      }),

    generateDraft: (conversationId: string, orgSlug?: string) =>
      request(`${base(orgSlug || config.orgSlug || "")}/${conversationId}/ai-draft`, {
        method: "POST",
        body: JSON.stringify({}),
      }),

    updateStatus: (id: string, status: string, orgSlug?: string) =>
      request(`${base(orgSlug || config.orgSlug || "")}/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
  };
}
