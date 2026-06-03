import type { OrgResponse, MemberResponse, UpdateOrgRequest, AddMemberRequest, UpdateMemberRoleRequest } from "@salesagent/shared-types";
import type { ClientConfig } from "../client";

type RequestFn = <T>(path: string, options?: RequestInit) => Promise<T>;

export function createOrganizationEndpoints(request: RequestFn, config: ClientConfig) {
  const base = (org: string) => `/api/orgs/${org}`;

  return {
    get: (orgSlug?: string) =>
      request<OrgResponse>(`${base(orgSlug || config.orgSlug || "")}`),

    update: (data: UpdateOrgRequest, orgSlug?: string) =>
      request<OrgResponse>(`${base(orgSlug || config.orgSlug || "")}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),

    listMembers: (orgSlug?: string) =>
      request<MemberResponse[]>(`${base(orgSlug || config.orgSlug || "")}/members`),

    addMember: (data: AddMemberRequest, orgSlug?: string) =>
      request<MemberResponse>(`${base(orgSlug || config.orgSlug || "")}/members`, {
        method: "POST",
        body: JSON.stringify(data),
      }),

    updateMemberRole: (memberId: string, data: UpdateMemberRoleRequest, orgSlug?: string) =>
      request<MemberResponse>(`${base(orgSlug || config.orgSlug || "")}/members/${memberId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
  };
}
