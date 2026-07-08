"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Brain, Search, Send } from "lucide-react";

export type AgentStep = {
  thought: string;
  tool: string;
  toolInput: string;
  observation: string;
};

type Props = {
  steps: AgentStep[];
  success: boolean;
};

const toolIcons: Record<string, React.ReactNode> = {
  get_lead_history: <span className="text-xs">📋</span>,
  search_knowledge_base: <Search className="size-3" />,
  get_lead_info: <span className="text-xs">👤</span>,
  send_followup_message: <Send className="size-3" />,
};

/**
 * Collapsible panel showing the ReAct Agent's reasoning steps.
 * Rendered below outbound messages that have aiMetadata.agentSteps.
 *
 * Each step shows: Thought → Tool call → Observation
 */
export function AgentThinkingPanel({ steps, success }: Props) {
  const [expanded, setExpanded] = useState(false);

  if (!steps || steps.length === 0) return null;

  return (
    <div className="mt-2 rounded-lg border border-border bg-bg-card/60 text-xs overflow-hidden">
      {/* Header — always visible */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2 px-3 py-2 text-text-muted hover:text-text transition-colors"
      >
        <Brain className="size-3.5 text-primary shrink-0" />
        <span className="font-medium">Agent 推理过程 · {steps.length} 步</span>
        <span
          className={`ml-auto shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
            success
              ? "bg-primary/10 text-primary"
              : "bg-danger/10 text-danger"
          }`}
        >
          {success ? "完成" : "未完成"}
        </span>
        {expanded ? (
          <ChevronUp className="size-3.5 shrink-0" />
        ) : (
          <ChevronDown className="size-3.5 shrink-0" />
        )}
      </button>

      {/* Expanded steps */}
      {expanded && (
        <div className="border-t border-border px-3 py-2.5 space-y-3 bg-bg-subtle/30">
          {steps.map((step, i) => (
            <div key={i} className="space-y-1.5">
              {/* Thought */}
              <div className="flex gap-1.5 text-text-secondary leading-relaxed">
                <span className="mt-0.5 shrink-0">💭</span>
                <span>{step.thought}</span>
              </div>

              {/* Tool call */}
              <div className="ml-5 flex items-center gap-1.5 rounded-lg bg-primary/5 border border-primary/10 px-2.5 py-1.5">
                {toolIcons[step.tool] ?? <span className="text-xs">🔧</span>}
                <span className="font-mono text-[11px] text-primary font-medium">
                  {step.tool}
                </span>
                {step.toolInput && (
                  <span className="text-text-muted truncate">
                    ({step.toolInput.slice(0, 40)}
                    {step.toolInput.length > 40 ? "…" : ""})
                  </span>
                )}
              </div>

              {/* Observation */}
              <div className="ml-5 text-text-muted leading-relaxed line-clamp-2">
                → {step.observation.slice(0, 150)}
                {step.observation.length > 150 ? "…" : ""}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
