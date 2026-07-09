import type { AuthResponse } from "@salesagent/shared-types";
import { createAuthEndpoints } from "./endpoints/auth";
import { createLeadEndpoints } from "./endpoints/leads";
import { createConversationEndpoints } from "./endpoints/conversations";
import { createCampaignEndpoints } from "./endpoints/campaigns";
import { createAgentEndpoints } from "./endpoints/agents";
import { createScriptEndpoints } from "./endpoints/scripts";
import { createOrganizationEndpoints } from "./endpoints/organizations";

export type AuthMode = "cookie" | "bearer";

export interface ClientConfig {
  baseUrl: string;
  authMode?: AuthMode;
  token?: string;
  orgSlug?: string;
}

export interface ApiClient {
  auth: ReturnType<typeof createAuthEndpoints>;
  leads: ReturnType<typeof createLeadEndpoints>;
  conversations: ReturnType<typeof createConversationEndpoints>;
  campaigns: ReturnType<typeof createCampaignEndpoints>;
  agents: ReturnType<typeof createAgentEndpoints>;
  scripts: ReturnType<typeof createScriptEndpoints>;
  organizations: ReturnType<typeof createOrganizationEndpoints>;
}

export function createClient(config: ClientConfig): ApiClient {
  const authMode = config.authMode ?? "cookie";

  // Build the authenticated fetch wrapper
  async function request<T>(
    path: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${config.baseUrl}${path}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string> || {}),
    };

    if (authMode === "bearer" && config.token) {
      headers["Authorization"] = `Bearer ${config.token}`;
    }

    const res = await fetch(url, {
      ...options,
      headers,
      credentials: authMode === "cookie" ? "include" : "omit",
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: res.statusText }));
      throw new ApiError(
        (body as { error?: string }).error || `Request failed with status ${res.status}`,
        res.status,
      );
    }

    return res.json() as Promise<T>;
  }

  return {
    auth: createAuthEndpoints(request, config),
    leads: createLeadEndpoints(request, config),
    conversations: createConversationEndpoints(request, config),
    campaigns: createCampaignEndpoints(request, config),
    agents: createAgentEndpoints(request, config),
    scripts: createScriptEndpoints(request, config),
    organizations: createOrganizationEndpoints(request, config),
  };
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}
