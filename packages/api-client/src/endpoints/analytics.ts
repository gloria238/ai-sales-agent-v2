import type { ClientConfig } from "../client";

type RequestFn = <T>(path: string, options?: RequestInit) => Promise<T>;

export function createAnalyticsEndpoints(request: RequestFn, config: ClientConfig) {
  const base = (org: string) => `/api/orgs/${org}/analytics`;

  return {
    pipeline: (orgSlug?: string) =>
      request<Record<string, unknown>>(`${base(orgSlug || config.orgSlug || "")}/pipeline`),

    campaigns: (orgSlug?: string) =>
      request<Record<string, unknown>>(`${base(orgSlug || config.orgSlug || "")}/campaigns`),

    conversions: (orgSlug?: string) =>
      request<Record<string, unknown>>(`${base(orgSlug || config.orgSlug || "")}/conversions`),
  };
}
