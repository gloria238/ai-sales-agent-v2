import {
  COMPOSE_RESPONSE_SYSTEM,
  LEAD_SCORING_SYSTEM,
  SUMMARIZE_CONVERSATION_SYSTEM,
  GENERATE_SCRIPT_SYSTEM,
  buildComposeResponsePrompt,
  buildLeadScoringPrompt,
  buildSummarizeConversationPrompt,
  buildGenerateScriptPrompt,
} from "./prompts";

// ── Types ──────────────────────────────────────────────────────────

export interface PromptVersion {
  version: string;
  deployedAt: string;
  system: string;
  builder: (...args: any[]) => string;
}

export type PromptKey =
  | "compose_response"
  | "score_lead"
  | "summarize_conversation"
  | "generate_script";

export interface VersionedPromptConfig {
  versions: Record<string, PromptVersion>; // "v1", "v2" ...
  current: string;                          // Feature Flag can override this at runtime
}

// ── Registry ──────────────────────────────────────────────────────

/** Central prompt version registry.
 *  - `current` is the default active version (runtime-mutable via Feature Flag).
 *  - New prompt versions are registered here with a version key and deployedAt timestamp.
 *  - Feature Flag `compose_prompt_version = "v2"` overrides `current` at runtime.
 */
export const PROMPT_REGISTRY: Record<PromptKey, VersionedPromptConfig> = {
  compose_response: {
    versions: {
      v1: {
        version: "v1",
        deployedAt: "2025-06-01",
        system: COMPOSE_RESPONSE_SYSTEM,
        builder: buildComposeResponsePrompt,
      },
    },
    current: "v1",
  },

  score_lead: {
    versions: {
      v1: {
        version: "v1",
        deployedAt: "2025-06-01",
        system: LEAD_SCORING_SYSTEM,
        builder: buildLeadScoringPrompt,
      },
    },
    current: "v1",
  },

  summarize_conversation: {
    versions: {
      v1: {
        version: "v1",
        deployedAt: "2025-06-01",
        system: SUMMARIZE_CONVERSATION_SYSTEM,
        builder: buildSummarizeConversationPrompt,
      },
    },
    current: "v1",
  },

  generate_script: {
    versions: {
      v1: {
        version: "v1",
        deployedAt: "2025-06-01",
        system: GENERATE_SCRIPT_SYSTEM,
        builder: buildGenerateScriptPrompt,
      },
    },
    current: "v1",
  },
};

// ── Helpers ────────────────────────────────────────────────────────

/** Get the active prompt version for a given key.
 *  Falls back to `current` if the requested version is not found.
 */
export function getPromptConfig(
  key: PromptKey,
  overrideVersion?: string,
): PromptVersion {
  const registry = PROMPT_REGISTRY[key];
  const version = overrideVersion || registry.current;
  return registry.versions[version] || registry.versions[registry.current];
}
